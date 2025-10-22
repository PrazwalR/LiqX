;;;; ═══════════════════════════════════════════════════════════
;;;; LiquidityGuard AI - Risk Assessment Logic (MeTTa)
;;;; 
;;;; This file defines symbolic reasoning for position risk assessment
;;;; ═══════════════════════════════════════════════════════════

;;; ─────────────────────────────────────────────────────────────
;;; TYPE DEFINITIONS
;;; ─────────────────────────────────────────────────────────────

;; Position representation
(: Position (-> Number Number Number String))
;; Position takes: collateral_value debt_value health_factor protocol

;; Risk level enumeration
(: RiskLevel (-> String))
(= (RiskLevel) (superpose (critical high moderate low safe)))

;; Market condition
(: MarketCondition (-> Number String))
;; MarketCondition takes: volatility_percent trend

;;; ─────────────────────────────────────────────────────────────
;;; RISK LEVEL CALCULATION
;;; ─────────────────────────────────────────────────────────────

;; Calculate risk level based on health factor
(: calculate-risk-level (-> Number String))
(= (calculate-risk-level $hf)
   (if (< $hf 1.3)
       critical
       (if (< $hf 1.5)
           high
           (if (< $hf 1.8)
               moderate
               (if (< $hf 2.0)
                   low
                   safe)))))

;;; ─────────────────────────────────────────────────────────────
;;; LIQUIDATION PROBABILITY
;;; ─────────────────────────────────────────────────────────────

;; Calculate liquidation probability (0-100%)
(: liquidation-probability (-> Number Number Number))
(= (liquidation-probability $hf $volatility)
   (let (
     ;; Base probability from health factor
     ($base-prob (if (< $hf 1.0) 
                     100 
                     (if (< $hf 1.3) 
                         80 
                         (if (< $hf 1.5) 
                             40 
                             (if (< $hf 1.8) 
                                 15 
                                 5)))))
     ;; Volatility multiplier (higher vol = higher risk)
     ($vol-multiplier (+ 1.0 (* $volatility 0.01)))
   )
   ;; Final probability (capped at 100)
   (min 100 (* $base-prob $vol-multiplier))))

;;; ─────────────────────────────────────────────────────────────
;;; TIME TO LIQUIDATION ESTIMATION
;;; ─────────────────────────────────────────────────────────────

;; Estimate time to liquidation in seconds
(: time-to-liquidation (-> Number Number Number Number))
(= (time-to-liquidation $hf $price $debt $price-drop-rate)
   (let (
     ;; Calculate price drop needed for liquidation (HF = 1.0)
     ($current-collateral (* (/ $debt 0.85) $hf))  ; Assuming 85% LTV
     ($liquidation-price (* $price (/ 0.85 $hf)))
     ($price-drop-needed (- $price $liquidation-price))
   )
   ;; Time = price_drop / drop_rate (in seconds)
   (if (> $price-drop-rate 0)
       (/ $price-drop-needed $price-drop-rate)
       999999)))  ; Very high number if no drop

;;; ─────────────────────────────────────────────────────────────
;;; URGENCY SCORING
;;; ─────────────────────────────────────────────────────────────

;; Calculate urgency score (0-10)
(: urgency-score (-> Number Number Number))
(= (urgency-score $hf $liquidation-prob $time-to-liq)
   (let (
     ;; Health factor component (0-4 points)
     ($hf-score (if (< $hf 1.3) 4
                    (if (< $hf 1.5) 3
                        (if (< $hf 1.8) 2
                            (if (< $hf 2.0) 1 0)))))
     ;; Probability component (0-3 points)
     ($prob-score (if (> $liquidation-prob 70) 3
                      (if (> $liquidation-prob 40) 2
                          (if (> $liquidation-prob 15) 1 0))))
     ;; Time component (0-3 points)
     ($time-score (if (< $time-to-liq 600) 3        ; < 10 min
                      (if (< $time-to-liq 3600) 2    ; < 1 hour
                          (if (< $time-to-liq 86400) 1 0))))  ; < 1 day
   )
   (+ $hf-score $prob-score $time-score)))

;;; ─────────────────────────────────────────────────────────────
;;; POSITION ANALYSIS
;;; ─────────────────────────────────────────────────────────────

;; Comprehensive position analysis
(: analyze-position (-> Number Number Number Number (List Symbol)))
(= (analyze-position $collateral $debt $hf $volatility)
   (let (
     ($risk-level (calculate-risk-level $hf))
     ($liq-prob (liquidation-probability $hf $volatility))
     ($urgency (urgency-score $hf $liq-prob 3600))  ; Assume 1 hour to liq
   )
   (cons risk-level $risk-level
         (cons liquidation-probability $liq-prob
               (cons urgency-score $urgency
                     (cons requires-action (> $urgency 5) 
                           empty))))))

;;; ─────────────────────────────────────────────────────────────
;;; PATTERN MATCHING FOR RISK SCENARIOS
;;; ─────────────────────────────────────────────────────────────

;; Match position to risk scenario
(: match-risk-scenario (-> Number Number String))
(= (match-risk-scenario $hf $collateral-usd)
   (match (list $hf $collateral-usd)
     ;; Critical scenarios
     ((list $h $c) (if (and (< $h 1.2) (> $c 50000))
                       "CRITICAL-LARGE-POSITION"
                       (if (< $h 1.2)
                           "CRITICAL-SMALL-POSITION"
                           ;; High risk scenarios
                           (if (and (< $h 1.5) (> $c 100000))
                               "HIGH-RISK-WHALE"
                               (if (< $h 1.5)
                                   "HIGH-RISK-RETAIL"
                                   ;; Moderate scenarios
                                   (if (< $h 1.8)
                                       "MODERATE-RISK"
                                       "LOW-RISK"))))))))

;;; ─────────────────────────────────────────────────────────────
;;; RECOMMENDED ACTIONS
;;; ─────────────────────────────────────────────────────────────

;; Generate action recommendation based on risk
(: recommend-action (-> String (List Symbol)))
(= (recommend-action $risk-scenario)
   (match $risk-scenario
     ("CRITICAL-LARGE-POSITION" 
      (list emergency-rebalance immediate-notification whale-protocol))
     ("CRITICAL-SMALL-POSITION"
      (list urgent-rebalance user-notification standard-protocol))
     ("HIGH-RISK-WHALE"
      (list proactive-rebalance whale-protocol multi-chain-optimization))
     ("HIGH-RISK-RETAIL"
      (list scheduled-rebalance standard-protocol single-chain-optimization))
     ("MODERATE-RISK"
      (list monitor-closely opportunistic-rebalance))
     ("LOW-RISK"
      (list routine-monitoring))
     ($other
      (list unknown-scenario manual-review))))

;;; ─────────────────────────────────────────────────────────────
;;; MARKET CONDITION ASSESSMENT
;;; ─────────────────────────────────────────────────────────────

;; Assess overall market risk
(: assess-market-risk (-> Number String String))
(= (assess-market-risk $volatility $trend)
   (match (list $volatility $trend)
     ((list $v "crash") (if (> $v 5.0) "EXTREME-RISK" "HIGH-RISK"))
     ((list $v "declining") (if (> $v 3.0) "HIGH-RISK" "MODERATE-RISK"))
     ((list $v "stable") "LOW-RISK")
     ((list $v "rising") "MINIMAL-RISK")
     ($other "UNKNOWN-RISK")))

;;; ─────────────────────────────────────────────────────────────
;;; EXECUTION PRIORITY
;;; ─────────────────────────────────────────────────────────────

;; Determine execution priority
(: execution-priority (-> Number Number String String))
(= (execution-priority $urgency $amount-usd $risk-level)
   (if (>= $urgency 8)
       "EMERGENCY"
       (if (and (>= $urgency 6) (> $amount-usd 50000))
           "HIGH"
           (if (>= $urgency 5)
               "NORMAL"
               "LOW"))))

;;; ─────────────────────────────────────────────────────────────
;;; KNOWLEDGE BASE - HISTORICAL PATTERNS
;;; ─────────────────────────────────────────────────────────────

;; Store learned patterns (self-modifying knowledge)
(: historical-liquidations (List (List Number String Boolean)))
;; Format: (health-factor market-condition was-liquidated)

;; Learn from history
(: predict-liquidation (-> Number String Number))
(= (predict-liquidation $hf $market)
   ;; Query similar historical cases
   ;; This would be populated by actual data
   (if (and (< $hf 1.3) (== $market "crash"))
       0.95  ; 95% chance based on history
       (if (< $hf 1.5)
           0.40  ; 40% chance
           0.05)))  ; 5% chance

;;; ─────────────────────────────────────────────────────────────
;;; MAIN RISK ASSESSMENT FUNCTION
;;; ─────────────────────────────────────────────────────────────

;; Complete risk assessment
(: assess-risk (-> Number Number Number Number String (List Symbol)))
(= (assess-risk $collateral $debt $hf $volatility $market-trend)
   (let (
     ($risk-level (calculate-risk-level $hf))
     ($scenario (match-risk-scenario $hf $collateral))
     ($liq-prob (liquidation-probability $hf $volatility))
     ($urgency (urgency-score $hf $liq-prob 3600))
     ($priority (execution-priority $urgency $collateral $risk-level))
     ($actions (recommend-action $scenario))
   )
   ;; Return comprehensive assessment
   (cons risk-level $risk-level
         (cons scenario $scenario
               (cons liquidation-probability $liq-prob
                     (cons urgency-score $urgency
                           (cons execution-priority $priority
                                 (cons recommended-actions $actions
                                       empty))))))))
