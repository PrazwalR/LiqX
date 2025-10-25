// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ============================================
// INTERFACES (Minimal ABIs)
// ============================================

interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    function getUserAccountData(
        address user
    )
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );
}

interface ILido {
    function submit(address referral) external payable returns (uint256);
}

interface IWstETH {
    function wrap(uint256 stETHAmount) external returns (uint256);

    function unwrap(uint256 wstETHAmount) external returns (uint256);
}

interface IComptroller {
    function enterMarkets(
        address[] calldata cTokens
    ) external returns (uint256[] memory);

    function getAccountLiquidity(
        address account
    ) external view returns (uint256, uint256, uint256);
}

interface ICToken {
    function mint(uint256 mintAmount) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function underlying() external view returns (address);
}

interface IAggregationRouterV5 {
    struct SwapDescription {
        address srcToken;
        address dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title LiquidityGuardVault
 * @notice AI-Powered DeFi Liquidation Protection Vault for LiqX
 * @dev Optimized single contract with inline Aave V3, Lido, Compound, 1inch, Uniswap integrations
 * @author LiqX Team
 */
contract LiquidityGuardVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE"); // Protocol addresses (immutable for gas optimization)
    address public immutable AAVE_POOL;
    address public immutable LIDO;
    address public immutable WSTETH;
    address public immutable COMPOUND_COMPTROLLER;
    address public immutable ONEINCH_ROUTER;
    address public immutable UNISWAP_V3_ROUTER;
    address public immutable UNISWAP_V2_ROUTER;
    address public immutable USDC; // Emergency liquidation target

    // Limits (18 decimals for HF, ether units for amounts)
    uint256 public constant MIN_HEALTH_FACTOR = 1.1e18;
    uint256 public constant MAX_POSITION_SIZE = 1000 ether;
    uint256 public constant MAX_TX_SIZE = 100_000 ether; // ~$100K equivalent
    uint256 public constant EXECUTION_COOLDOWN = 1 hours;
    uint256 public constant DAILY_EXECUTION_LIMIT = 10;
    uint256 public constant MAX_SLIPPAGE = 50; // 0.5% (basis points)

    // User & Agent tracking
    mapping(address => mapping(address => uint256)) public userDeposits; // user => asset => amount
    mapping(address => uint256) public agentLastExecution;
    mapping(address => uint256) public agentDailyExecutions;
    mapping(address => uint256) public agentDailyResetTime;
    mapping(address => bool) public userPaused;

    bool public circuitBreakerActive;

    // ============================================
    // EVENTS
    // ============================================

    event Deposit(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 timestamp
    );
    event Withdrawal(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 timestamp
    );
    event RebalanceExecuted(
        address indexed agent,
        address indexed user,
        string action,
        uint256 gasUsed
    );
    event HealthCheck(address indexed user, uint256 healthFactor);
    event EmergencyLiquidation(address indexed user, uint256 amountOut);
    event CircuitBreakerToggled(bool active);

    // ============================================
    // ERRORS
    // ============================================

    error Unauthorized();
    error InsufficientBalance();
    error HealthFactorTooLow(uint256 current, uint256 required);
    error ExceedsLimit();
    error CooldownActive();
    error CircuitBreakerTriggered();
    error UserPaused();
    error ZeroAmount();

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyAgent() {
        if (!hasRole(AGENT_ROLE, msg.sender)) revert Unauthorized();

        // Check cooldown
        if (
            block.timestamp <
            agentLastExecution[msg.sender] + EXECUTION_COOLDOWN
        ) revert CooldownActive();

        // Check daily limit (reset if new day)
        if (block.timestamp >= agentDailyResetTime[msg.sender] + 1 days) {
            agentDailyExecutions[msg.sender] = 0;
            agentDailyResetTime[msg.sender] = block.timestamp;
        }
        if (agentDailyExecutions[msg.sender] >= DAILY_EXECUTION_LIMIT)
            revert ExceedsLimit();

        agentLastExecution[msg.sender] = block.timestamp;
        agentDailyExecutions[msg.sender]++;
        _;
    }

    modifier whenNotPaused(address user) {
        if (userPaused[user]) revert UserPaused();
        if (circuitBreakerActive) revert CircuitBreakerTriggered();
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(
        address _aavePool,
        address _lido,
        address _wstETH,
        address _comptroller,
        address _oneInch,
        address _uniV3,
        address _uniV2,
        address _usdc
    ) {
        AAVE_POOL = _aavePool;
        LIDO = _lido;
        WSTETH = _wstETH;
        COMPOUND_COMPTROLLER = _comptroller;
        ONEINCH_ROUTER = _oneInch;
        UNISWAP_V3_ROUTER = _uniV3;
        UNISWAP_V2_ROUTER = _uniV2;
        USDC = _usdc;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ============================================
    // USER FUNCTIONS
    // ============================================

    /// @notice Deposit ERC20 assets to vault
    function deposit(address asset, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > MAX_POSITION_SIZE) revert ExceedsLimit();

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        userDeposits[msg.sender][asset] += amount;

        if (!hasRole(USER_ROLE, msg.sender)) {
            _grantRole(USER_ROLE, msg.sender);
        }

        emit Deposit(msg.sender, asset, amount, block.timestamp);
    }

    /// @notice Withdraw assets (checks health factor post-withdrawal)
    function withdraw(
        address asset,
        uint256 amount
    ) external nonReentrant whenNotPaused(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (userDeposits[msg.sender][asset] < amount)
            revert InsufficientBalance();

        userDeposits[msg.sender][asset] -= amount;
        IERC20(asset).safeTransfer(msg.sender, amount);

        // Post-check: Ensure health factor remains safe
        uint256 hf = checkHealthFactor(msg.sender);
        if (hf < MIN_HEALTH_FACTOR && hf != type(uint256).max) {
            revert HealthFactorTooLow(hf, MIN_HEALTH_FACTOR);
        }

        emit Withdrawal(msg.sender, asset, amount, block.timestamp);
    }

    /// @notice User pauses their own vault (prevents agent actions)
    function pauseVault() external {
        userPaused[msg.sender] = true;
    }

    /// @notice User unpauses their vault
    function unpauseVault() external {
        userPaused[msg.sender] = false;
    }

    // ============================================
    // AGENT FUNCTIONS
    // ============================================

    /// @notice Execute atomic rebalance: withdraw → swap → deposit
    /// @param user Target user
    /// @param strategyData Encoded: (uint8 action, address[] tokens, uint256[] amounts, bytes swapData)
    ///   action: 0=AaveToLido, 1=LidoToCompound, 2=CompoundToAave, etc.
    function executeRebalance(
        address user,
        bytes calldata strategyData
    ) external onlyAgent nonReentrant whenNotPaused(user) {
        uint256 gasStart = gasleft();

        (
            uint8 action,
            address[] memory tokens,
            uint256[] memory amounts,
            bytes memory swapData
        ) = abi.decode(strategyData, (uint8, address[], uint256[], bytes));

        if (amounts[0] > MAX_TX_SIZE) revert ExceedsLimit();

        // Pre-check health factor
        uint256 hfBefore = checkHealthFactor(user);
        if (hfBefore < MIN_HEALTH_FACTOR && hfBefore != type(uint256).max) {
            revert HealthFactorTooLow(hfBefore, MIN_HEALTH_FACTOR);
        }

        // Execute based on action
        if (action == 0) {
            // Aave → Lido: withdraw from Aave, swap to ETH, stake to Lido
            _withdrawFromAave(tokens[0], amounts[0]);
            uint256 ethOut = _swap1inch(
                tokens[0],
                address(0),
                amounts[0],
                swapData
            ); // ETH out
            _stakeToLido(ethOut);
        } else if (action == 1) {
            // Lido → Compound: unwrap wstETH, swap to token, deposit to Compound
            uint256 stETH = IWstETH(WSTETH).unwrap(amounts[0]);
            uint256 tokenOut = _swapUniswapV3(
                WSTETH,
                tokens[1],
                stETH,
                amounts[1]
            );
            _depositToCompound(tokens[1], tokenOut);
        } else if (action == 2) {
            // Compound → Aave: redeem from Compound, swap, deposit to Aave
            _withdrawFromCompound(tokens[0], amounts[0]);
            uint256 tokenOut = _swap1inch(
                tokens[0],
                tokens[1],
                amounts[0],
                swapData
            );
            _depositToAave(tokens[1], tokenOut);
        }
        // Add more actions as needed

        // Post-check health factor
        uint256 hfAfter = checkHealthFactor(user);
        if (hfAfter < MIN_HEALTH_FACTOR && hfAfter != type(uint256).max) {
            revert HealthFactorTooLow(hfAfter, MIN_HEALTH_FACTOR);
        }

        emit RebalanceExecuted(
            msg.sender,
            user,
            _actionToString(action),
            gasStart - gasleft()
        );
    }

    /// @notice Emergency liquidation if HF < 1.0: swap all to USDC
    function emergencyLiquidate(
        address user,
        address[] calldata assets
    ) external onlyAgent nonReentrant {
        uint256 hf = checkHealthFactor(user);
        if (hf >= 1e18 && hf != type(uint256).max)
            revert HealthFactorTooLow(hf, 1e18);

        uint256 totalUSDC;
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 balance = userDeposits[user][assets[i]];
            if (balance > 0) {
                userDeposits[user][assets[i]] = 0;
                uint256 usdcOut = _swapUniswapV2(assets[i], USDC, balance);
                totalUSDC += usdcOut;
            }
        }

        userDeposits[user][USDC] = totalUSDC;
        emit EmergencyLiquidation(user, totalUSDC);
    }

    // ============================================
    // PROTOCOL INTEGRATIONS (Inline)
    // ============================================

    function _depositToAave(address asset, uint256 amount) internal {
        IERC20(asset).forceApprove(AAVE_POOL, amount);
        IAavePool(AAVE_POOL).supply(asset, amount, address(this), 0);
    }

    function _withdrawFromAave(address asset, uint256 amount) internal {
        IAavePool(AAVE_POOL).withdraw(asset, amount, address(this));
    }

    function _stakeToLido(uint256 amount) internal {
        ILido(LIDO).submit{value: amount}(address(0));
        // Wrap stETH to wstETH for storage
        uint256 stETH = IERC20(LIDO).balanceOf(address(this));
        IERC20(LIDO).forceApprove(WSTETH, stETH);
        IWstETH(WSTETH).wrap(stETH);
    }

    function _depositToCompound(address asset, uint256 amount) internal {
        address cToken = _getCToken(asset); // Assume mapping or registry
        IERC20(asset).forceApprove(cToken, amount);
        require(ICToken(cToken).mint(amount) == 0, "Compound mint failed");
    }

    function _withdrawFromCompound(address asset, uint256 amount) internal {
        address cToken = _getCToken(asset);
        require(
            ICToken(cToken).redeemUnderlying(amount) == 0,
            "Compound redeem failed"
        );
    }

    function _getCToken(address) internal pure returns (address) {
        // Mock: Return hardcoded cToken addresses or use a registry
        return address(0); // Placeholder
    }

    // ============================================
    // SWAP INTEGRATIONS
    // ============================================

    function _swap1inch(
        address srcToken,
        address dstToken,
        uint256 amount,
        bytes memory swapData
    ) internal returns (uint256) {
        IERC20(srcToken).forceApprove(ONEINCH_ROUTER, amount);

        IAggregationRouterV5.SwapDescription memory desc = IAggregationRouterV5
            .SwapDescription({
                srcToken: srcToken,
                dstToken: dstToken,
                srcReceiver: payable(address(this)),
                dstReceiver: payable(address(this)),
                amount: amount,
                minReturnAmount: (amount * (10000 - MAX_SLIPPAGE)) / 10000, // 0.5% slippage
                flags: 0
            });

        (uint256 returnAmount, ) = IAggregationRouterV5(ONEINCH_ROUTER).swap(
            address(0),
            desc,
            "",
            swapData
        );
        return returnAmount;
    }

    function _swapUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256) {
        IERC20(tokenIn).forceApprove(UNISWAP_V3_ROUTER, amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 3000, // 0.3%
                recipient: address(this),
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });

        return ISwapRouter(UNISWAP_V3_ROUTER).exactInputSingle(params);
    }

    function _swapUniswapV2(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal returns (uint256) {
        IERC20(tokenIn).forceApprove(UNISWAP_V2_ROUTER, amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .swapExactTokensForTokens(
                amountIn,
                (amountIn * (10000 - MAX_SLIPPAGE)) / 10000,
                path,
                address(this),
                block.timestamp + 300
            );

        return amounts[amounts.length - 1];
    }

    // ============================================
    // SAFETY & VIEW FUNCTIONS
    // ============================================

    /// @notice Check health factor across Aave & Compound
    function checkHealthFactor(address user) public view returns (uint256) {
        // Check Aave HF
        try IAavePool(AAVE_POOL).getUserAccountData(user) returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256 hf
        ) {
            if (hf > 0 && hf < type(uint256).max) return hf;
        } catch {}

        // Check Compound liquidity (simplified)
        try
            IComptroller(COMPOUND_COMPTROLLER).getAccountLiquidity(user)
        returns (uint256, uint256 liquidity, uint256 shortfall) {
            if (shortfall > 0) return 0; // Critical
            if (liquidity > 0) return type(uint256).max; // Safe
        } catch {}

        return type(uint256).max; // No position = safe
    }

    /// @notice Get user's total balance for an asset
    function getUserBalance(
        address user,
        address asset
    ) external view returns (uint256) {
        return userDeposits[user][asset];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function grantAgentRole(
        address agent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(AGENT_ROLE, agent);
    }

    function revokeAgentRole(
        address agent
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(AGENT_ROLE, agent);
    }

    function toggleCircuitBreaker() external onlyRole(DEFAULT_ADMIN_ROLE) {
        circuitBreakerActive = !circuitBreakerActive;
        emit CircuitBreakerToggled(circuitBreakerActive);
    }

    function recoverTokens(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    // ============================================
    // HELPERS
    // ============================================

    function _actionToString(
        uint8 action
    ) internal pure returns (string memory) {
        if (action == 0) return "AaveToLido";
        if (action == 1) return "LidoToCompound";
        if (action == 2) return "CompoundToAave";
        return "Unknown";
    }

    receive() external payable {}
}
