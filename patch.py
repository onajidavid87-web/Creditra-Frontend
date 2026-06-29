import sys

# AmountInput.tsx
content = open("src/components/AmountInput.tsx").read()
content = content.replace(
    '          <span className="font-semibold text-foreground">\n            {formatMoney(creditLine.available)}',
    '          <span className="font-semibold text-foreground tabular-nums">\n            {formatMoney(creditLine.available)}'
)
content = content.replace(
    'className="text-2xl font-bold bg-transparent outline-none flex-1 text-foreground placeholder:text-muted/50 min-w-0"',
    'className="text-2xl font-bold bg-transparent outline-none flex-1 text-foreground placeholder:text-muted/50 min-w-0 tabular-nums"'
)
content = content.replace(
    '<p className="text-sm font-semibold text-foreground">\n              {formatMoney(validation.minAmount)}',
    '<p className="text-sm font-semibold text-foreground tabular-nums">\n              {formatMoney(validation.minAmount)}'
)
content = content.replace(
    '<p className="text-sm font-semibold text-foreground">\n              {formatMoney(validation.maxAmount)}',
    '<p className="text-sm font-semibold text-foreground tabular-nums">\n              {formatMoney(validation.maxAmount)}'
)
content = content.replace(
    '<p className="text-sm font-semibold text-foreground">\n              {formatMoney(validation.recommendedReserve)}',
    '<p className="text-sm font-semibold text-foreground tabular-nums">\n              {formatMoney(validation.recommendedReserve)}'
)
content = content.replace(
    '<span className="font-semibold text-foreground">\n            {formatMoney(numAmount)}',
    '<span className="font-semibold text-foreground tabular-nums">\n            {formatMoney(numAmount)}'
)
content = content.replace(
    'className={`font-semibold ${validation.remainingCredit < validation.recommendedReserve && numAmount > 0 ? "text-amber-400" : "text-foreground"}`}',
    'className={`font-semibold tabular-nums ${validation.remainingCredit < validation.recommendedReserve && numAmount > 0 ? "text-amber-400" : "text-foreground"}`}'
)
open("src/components/AmountInput.tsx", "w").write(content)

# ConfirmationStep.tsx
content = open("src/components/ConfirmationStep.tsx").read()
content = content.replace(
    '<p className="mt-1 text-3xl font-bold text-foreground">\n                {formatMoney(safeAmount)}',
    '<p className="mt-1 text-3xl font-bold text-foreground tabular-nums">\n                {formatMoney(safeAmount)}'
)
content = content.replace(
    '<p className="mt-1 font-semibold text-foreground">\n                {formatMoney(fee)}',
    '<p className="mt-1 font-semibold text-foreground tabular-nums">\n                {formatMoney(fee)}'
)
content = content.replace(
    '<p className="mt-1 font-semibold text-foreground">\n                {formatMoney(estimatedMonthlyInterest)}',
    '<p className="mt-1 font-semibold text-foreground tabular-nums">\n                {formatMoney(estimatedMonthlyInterest)}'
)
content = content.replace(
    '<p className="mt-1 font-semibold text-foreground">\n                {formatMoney(newBalance)}',
    '<p className="mt-1 font-semibold text-foreground tabular-nums">\n                {formatMoney(newBalance)}'
)
content = content.replace(
    '<p className="mt-1 font-semibold text-foreground">\n                {formatMoney(remainingAvailable)}',
    '<p className="mt-1 font-semibold text-foreground tabular-nums">\n                {formatMoney(remainingAvailable)}'
)
content = content.replace(
    '<span className="font-semibold text-foreground">\n                {creditLine.utilization}%',
    '<span className="font-semibold text-foreground tabular-nums">\n                {creditLine.utilization}%'
)
content = content.replace(
    'className={`font-semibold ${newUtilization > 80 ? "text-yellow-500" : "text-foreground"}`}',
    'className={`font-semibold tabular-nums ${newUtilization > 80 ? "text-yellow-500" : "text-foreground"}`}'
)
open("src/components/ConfirmationStep.tsx", "w").write(content)
