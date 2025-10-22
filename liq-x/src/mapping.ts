import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import {
  Supply as SupplyEvent,
  Borrow as BorrowEvent,
  Withdraw as WithdrawEvent,
  Repay as RepayEvent,
  LiquidationCall as LiquidationEvent
} from "../generated/AaveV3Pool/Pool"
import {
  User,
  Position,
  Supply,
  Borrow,
  Liquidation,
  Protocol
} from "../generated/schema"

const ZERO_BD = BigDecimal.fromString("0")
const ONE_BD = BigDecimal.fromString("1")

export function handleSupply(event: SupplyEvent): void {
  let userId = event.params.user.toHexString()
  let user = User.load(userId)

  if (user == null) {
    user = new User(userId)
    user.totalSupplied = ZERO_BD
    user.totalBorrowed = ZERO_BD
    user.liquidationCount = 0
    user.lastUpdated = event.block.timestamp
  }

  // Create Supply entity
  let supplyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let supply = new Supply(supplyId)
  supply.user = userId
  supply.asset = event.params.reserve.toHexString()
  supply.amount = event.params.amount.toBigDecimal()
  supply.timestamp = event.block.timestamp
  supply.txHash = event.transaction.hash.toHexString()
  supply.save()

  // Update User
  user.totalSupplied = user.totalSupplied.plus(event.params.amount.toBigDecimal())
  user.lastUpdated = event.block.timestamp
  user.save()

  // Update or create Position
  let positionId = userId + "-" + event.params.reserve.toHexString()
  let position = Position.load(positionId)

  if (position == null) {
    position = new Position(positionId)
    position.user = userId
    position.collateralAsset = event.params.reserve.toHexString()
    position.collateralAmount = ZERO_BD
    position.debtAsset = ""
    position.debtAmount = ZERO_BD
    position.healthFactor = BigDecimal.fromString("999")
    position.isActive = true
    position.createdAt = event.block.timestamp
  }

  position.collateralAmount = position.collateralAmount.plus(event.params.amount.toBigDecimal())
  position.updatedAt = event.block.timestamp
  position.save()

  updateProtocolStats(event.block.timestamp)
}

export function handleBorrow(event: BorrowEvent): void {
  let userId = event.params.user.toHexString()
  let user = User.load(userId)

  if (user == null) {
    user = new User(userId)
    user.totalSupplied = ZERO_BD
    user.totalBorrowed = ZERO_BD
    user.liquidationCount = 0
    user.lastUpdated = event.block.timestamp
  }

  // Create Borrow entity
  let borrowId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let borrow = new Borrow(borrowId)
  borrow.user = userId
  borrow.asset = event.params.reserve.toHexString()
  borrow.amount = event.params.amount.toBigDecimal()
  borrow.interestRateMode = event.params.interestRateMode
  borrow.timestamp = event.block.timestamp
  borrow.txHash = event.transaction.hash.toHexString()
  borrow.save()

  // Update User
  user.totalBorrowed = user.totalBorrowed.plus(event.params.amount.toBigDecimal())
  user.lastUpdated = event.block.timestamp
  user.save()

  // Update Position
  let positionId = userId + "-" + event.params.reserve.toHexString()
  let position = Position.load(positionId)

  if (position == null) {
    position = new Position(positionId)
    position.user = userId
    position.collateralAsset = ""
    position.collateralAmount = ZERO_BD
    position.debtAsset = event.params.reserve.toHexString()
    position.debtAmount = ZERO_BD
    position.healthFactor = BigDecimal.fromString("999")
    position.isActive = true
    position.createdAt = event.block.timestamp
  }

  position.debtAmount = position.debtAmount.plus(event.params.amount.toBigDecimal())
  position.updatedAt = event.block.timestamp

  // Calculate health factor (simplified - actual calculation needs oracle prices)
  if (position.debtAmount.gt(ZERO_BD)) {
    position.healthFactor = position.collateralAmount.div(position.debtAmount).times(BigDecimal.fromString("0.85"))
  }

  position.save()

  updateProtocolStats(event.block.timestamp)
}

export function handleWithdraw(event: WithdrawEvent): void {
  let userId = event.params.user.toHexString()
  let positionId = userId + "-" + event.params.reserve.toHexString()
  let position = Position.load(positionId)

  if (position != null) {
    position.collateralAmount = position.collateralAmount.minus(event.params.amount.toBigDecimal())
    position.updatedAt = event.block.timestamp

    if (position.collateralAmount.le(ZERO_BD)) {
      position.isActive = false
    }

    position.save()
  }

  updateProtocolStats(event.block.timestamp)
}

export function handleRepay(event: RepayEvent): void {
  let userId = event.params.user.toHexString()
  let positionId = userId + "-" + event.params.reserve.toHexString()
  let position = Position.load(positionId)

  if (position != null) {
    position.debtAmount = position.debtAmount.minus(event.params.amount.toBigDecimal())
    position.updatedAt = event.block.timestamp

    // Recalculate health factor
    if (position.debtAmount.gt(ZERO_BD)) {
      position.healthFactor = position.collateralAmount.div(position.debtAmount).times(BigDecimal.fromString("0.85"))
    } else {
      position.healthFactor = BigDecimal.fromString("999")
    }

    if (position.debtAmount.le(ZERO_BD)) {
      position.isActive = false
    }

    position.save()
  }

  updateProtocolStats(event.block.timestamp)
}

export function handleLiquidation(event: LiquidationEvent): void {
  let userId = event.params.user.toHexString()

  // Create Liquidation entity
  let liquidationId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let liquidation = new Liquidation(liquidationId)

  let positionId = userId + "-" + event.params.collateralAsset.toHexString()
  liquidation.position = positionId
  liquidation.collateralAsset = event.params.collateralAsset.toHexString()
  liquidation.debtAsset = event.params.debtAsset.toHexString()
  liquidation.debtToCover = event.params.debtToCover.toBigDecimal()
  liquidation.liquidatedCollateralAmount = event.params.liquidatedCollateralAmount.toBigDecimal()
  liquidation.liquidator = event.params.liquidator.toHexString()
  liquidation.timestamp = event.block.timestamp
  liquidation.txHash = event.transaction.hash.toHexString()
  liquidation.save()

  // Update User
  let user = User.load(userId)
  if (user != null) {
    user.liquidationCount = user.liquidationCount + 1
    user.lastUpdated = event.block.timestamp
    user.save()
  }

  // Update Position
  let position = Position.load(positionId)
  if (position != null) {
    position.collateralAmount = position.collateralAmount.minus(event.params.liquidatedCollateralAmount.toBigDecimal())
    position.debtAmount = position.debtAmount.minus(event.params.debtToCover.toBigDecimal())
    position.updatedAt = event.block.timestamp

    if (position.collateralAmount.le(ZERO_BD) || position.debtAmount.le(ZERO_BD)) {
      position.isActive = false
    } else {
      // Recalculate health factor
      position.healthFactor = position.collateralAmount.div(position.debtAmount).times(BigDecimal.fromString("0.85"))
    }

    position.save()
  }

  updateProtocolStats(event.block.timestamp)
}

function updateProtocolStats(timestamp: BigInt): void {
  let protocol = Protocol.load("1")

  if (protocol == null) {
    protocol = new Protocol("1")
    protocol.totalValueLocked = ZERO_BD
    protocol.totalBorrowed = ZERO_BD
    protocol.totalLiquidations = 0
  }

  // Note: This is simplified - actual implementation would aggregate all positions
  protocol.lastUpdated = timestamp
  protocol.save()
}
