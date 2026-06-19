/**
 * Kalkulator Posisi Saham Indonesia (KPSI)
 * Core Logic & Interactive UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Fee Settings
    const FEE_BUY = 0.0015;  // 0.15%
    const FEE_SELL = 0.0025; // 0.25%

    // DOM Elements - Inputs
    const capitalInput = document.getElementById('input-capital');
    const entryInput = document.getElementById('input-entry');
    const lotInput = document.getElementById('input-lot');
    const riskInput = document.getElementById('input-risk');
    const tpInput = document.getElementById('input-tp');
    
    // DOM Elements - Preset Buttons
    const presetBtns = document.querySelectorAll('.btn-preset');

    // DOM Elements - Labels & Info
    const entryTickInfo = document.getElementById('entry-tick-info');
    const entryLotPrice = document.getElementById('entry-lot-price');
    const sharesCount = document.getElementById('shares-count');
    const riskAmountLabel = document.getElementById('risk-amount-label');
    const tpTickInfo = document.getElementById('tp-tick-info');
    
    // DOM Elements - Summary Outputs
    const valTotalCost = document.getElementById('val-total-cost');
    const valTotalCostPercent = document.getElementById('val-total-cost-percent');
    const valRiskAmount = document.getElementById('val-risk-amount');
    const valRiskTicks = document.getElementById('val-risk-ticks');
    const valNetProfit = document.getElementById('val-net-profit');
    const valProfitPercent = document.getElementById('val-profit-percent');

    // DOM Elements - Breakdown Outputs
    const valGrossBuy = document.getElementById('val-gross-buy');
    const valBuyFee = document.getElementById('val-buy-fee');
    const valGrossSell = document.getElementById('val-gross-sell');
    const valSellFee = document.getElementById('val-sell-fee');
    const valNetReturn = document.getElementById('val-net-return');

    // DOM Elements - Risk Management Outputs
    const valSlPrice = document.getElementById('val-sl-price');
    const valSlDiff = document.getElementById('val-sl-diff');
    const valRrRatio = document.getElementById('val-rr-ratio');
    
    // DOM Elements - Gauge
    const posAllocationText = document.getElementById('pos-allocation-text');
    const posAllocationBar = document.getElementById('pos-allocation-bar');
    
    // DOM Elements - Matrix
    const matrixTbody = document.getElementById('matrix-tbody');
    const matrixTickInfo = document.getElementById('matrix-tick-info');

    // Helper: Formatter for Rupiah Currency
    function formatRupiah(value) {
        if (value === null || value === undefined || isNaN(value)) return "Rp 0";
        return "Rp " + Math.round(value).toLocaleString('id-ID');
    }

    // Helper: Formatter for general integer inputs (adds dots as thousands separator)
    function formatNumberString(str) {
        let clean = str.replace(/\D/g, '');
        if (clean === '') return '';
        return parseInt(clean, 10).toLocaleString('id-ID');
    }

    // Helper: Parser for dot-separated numbers
    function parseNumber(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseInt(val.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
    }

    // BEI Tick Rules Definition
    function getTickSize(price) {
        if (price < 200) return 1;
        if (price < 500) return 2;
        if (price < 2000) return 5;
        if (price < 5000) return 10;
        return 25;
    }

    // Align any custom price to the valid BEI tick size
    function alignToTick(price) {
        if (price <= 0) return 0;
        if (price < 200) {
            return Math.round(price);
        } else if (price < 500) {
            return 200 + Math.round((price - 200) / 2) * 2;
        } else if (price < 2000) {
            return 500 + Math.round((price - 500) / 5) * 5;
        } else if (price < 5000) {
            return 2000 + Math.round((price - 2000) / 10) * 10;
        } else {
            return 5000 + Math.round((price - 5000) / 25) * 25;
        }
    }

    // Tick Step Up
    function tickUp(price) {
        const ts = getTickSize(price);
        return price + ts;
    }

    // Tick Step Down
    function tickDown(price) {
        let ts;
        if (price <= 200) {
            ts = 1;
        } else if (price <= 500) {
            ts = (price === 200) ? 1 : 2;
        } else if (price <= 2000) {
            ts = (price === 500) ? 2 : 5;
        } else if (price <= 5000) {
            ts = (price === 2000) ? 5 : 10;
        } else {
            ts = (price === 5000) ? 10 : 25;
        }
        return price - ts;
    }

    // Count exact ticks between two aligned prices
    function countTicksBetween(startPrice, endPrice) {
        if (startPrice === endPrice) return 0;
        let count = 0;
        let current = startPrice;
        if (startPrice < endPrice) {
            while (current < endPrice) {
                let next = tickUp(current);
                if (next === current) break; // safety
                current = next;
                count++;
            }
        } else {
            while (current > endPrice) {
                let next = tickDown(current);
                if (next === current || next <= 0) break; // safety
                current = next;
                count++;
            }
        }
        return count;
    }

    // Core Calculation & UI Update
    function calculate() {
        // Read Inputs
        const capital = parseNumber(capitalInput.value) || 10000000;
        const rawEntry = parseNumber(entryInput.value) || 1000;
        const lots = parseNumber(lotInput.value) || 10;
        const riskPercent = parseFloat(riskInput.value) || 1.0;
        const rawTp = parseNumber(tpInput.value) || 1100;

        // Auto-alignment (BEI Rules)
        const entryPrice = alignToTick(rawEntry);
        const tpPrice = alignToTick(rawTp);

        // Update aligned helper text labels
        const entryTick = getTickSize(entryPrice);
        const tpTick = getTickSize(tpPrice);
        entryTickInfo.textContent = `Tick: Rp ${entryTick}`;
        tpTickInfo.textContent = `Tick: Rp ${tpTick}`;

        const pricePerLot = entryPrice * 100;
        entryLotPrice.textContent = `1 Lot = ${formatRupiah(pricePerLot)}`;
        
        const totalShares = lots * 100;
        sharesCount.textContent = `${totalShares.toLocaleString('id-ID')} lembar`;

        // Cost & Fee Calculation for Buying
        const grossBuyValue = totalShares * entryPrice;
        const buyFee = grossBuyValue * FEE_BUY;
        const totalCost = grossBuyValue + buyFee;

        // Risk Amount
        const riskAmount = capital * (riskPercent / 100);
        riskAmountLabel.textContent = formatRupiah(riskAmount);

        // Position size constraints
        const allocationPercent = (totalCost / capital) * 100;

        // Stop Loss calculation (Exact Net)
        // Loss_net = Cost_buy - Return_sell = RiskAmount
        // Return_sell = Cost_buy - RiskAmount
        // P_sl * N * (1 - FEE_SELL) = Cost_buy - RiskAmount
        // P_sl = (Cost_buy - RiskAmount) / (N * (1 - FEE_SELL))
        let targetReturnSell = totalCost - riskAmount;
        let slPriceNet = 0;
        let slPriceNetAligned = 0;
        let riskTicks = 0;
        
        if (targetReturnSell > 0 && totalShares > 0) {
            slPriceNet = targetReturnSell / (totalShares * (1 - FEE_SELL));
            slPriceNetAligned = alignToTick(slPriceNet);
            // Ensure SL is strictly lower than entry price
            if (slPriceNetAligned >= entryPrice) {
                slPriceNetAligned = tickDown(entryPrice);
            }
            riskTicks = countTicksBetween(entryPrice, slPriceNetAligned);
        } else {
            slPriceNetAligned = tickDown(entryPrice);
            riskTicks = 1;
        }

        // Take Profit & Potential Profit
        const grossSellValue = totalShares * tpPrice;
        const sellFee = grossSellValue * FEE_SELL;
        const netReturn = grossSellValue - sellFee;
        const netProfit = netReturn - totalCost;
        const profitPercentVal = (netProfit / totalCost) * 100;

        // Realized Loss at Aligned SL Price
        const realizedReturnSell = totalShares * slPriceNetAligned * (1 - FEE_SELL);
        const realizedNetLoss = totalCost - realizedReturnSell;

        // Risk to Reward Ratio
        let rrRatio = 0;
        if (realizedNetLoss > 0) {
            rrRatio = netProfit / realizedNetLoss;
        }

        // DOM Update - Summary Cards
        valTotalCost.textContent = formatRupiah(totalCost);
        valTotalCostPercent.textContent = `${allocationPercent.toFixed(2)}% dari Modal`;

        valRiskAmount.textContent = formatRupiah(realizedNetLoss);
        valRiskTicks.textContent = `Setara ~${riskTicks} Tick (${((entryPrice - slPriceNetAligned) / entryPrice * 100).toFixed(1)}%)`;

        valNetProfit.textContent = formatRupiah(netProfit);
        if (netProfit >= 0) {
            valNetProfit.className = "metric-value text-profit";
            valProfitPercent.textContent = `+${((netProfit / capital) * 100).toFixed(2)}% modal / +${profitPercentVal.toFixed(2)}% modal trade`;
        } else {
            valNetProfit.className = "metric-value text-loss";
            valProfitPercent.textContent = `${((netProfit / capital) * 100).toFixed(2)}% modal / ${profitPercentVal.toFixed(2)}% modal trade`;
        }

        // DOM Update - Rincian Transaksi
        valGrossBuy.textContent = formatRupiah(grossBuyValue);
        valBuyFee.textContent = formatRupiah(buyFee);
        valGrossSell.textContent = formatRupiah(grossSellValue);
        valSellFee.textContent = formatRupiah(sellFee);
        valNetReturn.textContent = formatRupiah(netReturn);

        // DOM Update - Manajemen Risiko
        valSlPrice.textContent = formatRupiah(slPriceNetAligned);
        valSlDiff.textContent = `${formatRupiah(entryPrice - slPriceNetAligned)} (${((entryPrice - slPriceNetAligned) / entryPrice * 100).toFixed(2)}%)`;
        valRrRatio.textContent = rrRatio >= 0 ? rrRatio.toFixed(2) : "0.00";
        
        // Dynamic styling for R:R badge
        valRrRatio.className = "breakdown-val badge " + (rrRatio >= 2 ? "badge-success" : (rrRatio >= 1 ? "badge-primary" : "badge-danger"));

        // DOM Update - Modal Allocation Visual Bar
        posAllocationText.textContent = `${allocationPercent.toFixed(1)}%`;
        posAllocationBar.style.width = `${Math.min(allocationPercent, 100)}%`;
        if (allocationPercent > 100) {
            posAllocationBar.style.background = 'var(--danger)';
            posAllocationText.style.color = 'var(--danger)';
        } else if (allocationPercent > 50) {
            posAllocationBar.style.background = 'var(--warning)';
            posAllocationText.style.color = 'var(--warning)';
        } else {
            posAllocationBar.style.background = 'linear-gradient(90deg, var(--primary) 0%, #818cf8 100%)';
            posAllocationText.style.color = 'var(--primary)';
        }

        // DOM Update - Render Tick Matrix Table
        renderTickMatrix(entryPrice, totalShares, totalCost);
    }

    // Render the surrounding 5 ticks up and 5 ticks down
    function renderTickMatrix(entryPrice, totalShares, totalCost) {
        matrixTickInfo.textContent = `Fraksi Aktif: Rp ${getTickSize(entryPrice)}`;
        
        // Generate prices
        const rows = [];
        
        // 5 Ticks Up
        let cur = entryPrice;
        const ups = [];
        for (let i = 0; i < 5; i++) {
            cur = tickUp(cur);
            ups.unshift(cur); // Unshift so that highest is first
        }
        
        // 5 Ticks Down
        cur = entryPrice;
        const downs = [];
        for (let i = 0; i < 5; i++) {
            cur = tickDown(cur);
            downs.push(cur);
        }

        const allPrices = [...ups, entryPrice, ...downs];

        matrixTbody.innerHTML = '';
        
        allPrices.forEach(price => {
            const isEntry = price === entryPrice;
            const diffPrice = price - entryPrice;
            const diffPercent = (diffPrice / entryPrice) * 100;
            const ticksCount = countTicksBetween(entryPrice, price);
            const displayTicks = diffPrice === 0 ? "Entry" : (diffPrice > 0 ? `+${ticksCount}` : `-${ticksCount}`);

            // Net Return of selling at this price
            const grossReturn = totalShares * price;
            const sellFee = grossReturn * FEE_SELL;
            const netReturn = grossReturn - sellFee;
            const netPnL = netReturn - totalCost;
            const pnlPercent = (netPnL / totalCost) * 100;

            const tr = document.createElement('tr');
            if (isEntry) {
                tr.className = 'entry-row';
            }

            // Columns data:
            // 1. Tick Count
            const tdTick = document.createElement('td');
            if (isEntry) {
                tdTick.innerHTML = `<span class="entry-label">Entry</span>`;
            } else {
                tdTick.textContent = displayTicks;
                tdTick.className = diffPrice > 0 ? 'text-profit' : 'text-loss';
            }

            // 2. Share Price
            const tdPrice = document.createElement('td');
            tdPrice.textContent = price.toLocaleString('id-ID');
            if (isEntry) tdPrice.style.fontWeight = '700';

            // 3. Percent Change
            const tdPercent = document.createElement('td');
            tdPercent.textContent = (diffPrice > 0 ? '+' : '') + diffPercent.toFixed(2) + '%';
            tdPercent.className = diffPrice > 0 ? 'text-profit' : (diffPrice < 0 ? 'text-loss' : 'text-neutral');

            // 4. Net Return Value
            const tdNetReturn = document.createElement('td');
            tdNetReturn.textContent = formatRupiah(netReturn);

            // 5. Net PnL Rp
            const tdPnL = document.createElement('td');
            tdPnL.textContent = (netPnL >= 0 ? '+' : '') + formatRupiah(netPnL);
            tdPnL.className = netPnL >= 0 ? 'text-profit' : 'text-loss';

            // 6. Net PnL % Ratio
            const tdRatio = document.createElement('td');
            tdRatio.textContent = (netPnL >= 0 ? '+' : '') + pnlPercent.toFixed(2) + '%';
            tdRatio.className = netPnL >= 0 ? 'text-profit' : 'text-loss';

            tr.appendChild(tdTick);
            tr.appendChild(tdPrice);
            tr.appendChild(tdPercent);
            tr.appendChild(tdNetReturn);
            tr.appendChild(tdPnL);
            tr.appendChild(tdRatio);

            matrixTbody.appendChild(tr);
        });
    }

    // Keyboard and Event Formatting
    function registerEvents(inputEl) {
        inputEl.addEventListener('input', (e) => {
            // Keep track of cursor position
            let selectionStart = e.target.selectionStart;
            let originalLength = e.target.value.length;

            // Format numbers with dots
            let formatted = formatNumberString(e.target.value);
            e.target.value = formatted;

            // Restore cursor position
            let newLength = formatted.length;
            let diff = newLength - originalLength;
            e.target.setSelectionRange(selectionStart + diff, selectionStart + diff);

            calculate();
        });

        inputEl.addEventListener('blur', (e) => {
            // Align entry or tp on blur
            if (e.target.id === 'input-entry' || e.target.id === 'input-tp') {
                const val = parseNumber(e.target.value);
                const aligned = alignToTick(val);
                e.target.value = aligned.toLocaleString('id-ID');
            }
            calculate();
        });
    }

    // Setup input event hooks
    registerEvents(capitalInput);
    registerEvents(entryInput);
    registerEvents(lotInput);
    registerEvents(tpInput);

    riskInput.addEventListener('input', calculate);

    // Preset Risk Button Event Handlers
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            riskInput.value = btn.getAttribute('data-value');
            calculate();
        });
    });

    riskInput.addEventListener('focus', () => {
        // Deactivate presets if custom typed
        presetBtns.forEach(b => b.classList.remove('active'));
    });

    // Run Initial Calculation
    calculate();
});
