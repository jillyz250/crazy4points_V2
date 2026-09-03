'use client'

/**
 * A small, genuinely-usable calculator for the Expenses page (Erica). Basic
 * arithmetic (+ − × ÷), a running result, and full keyboard support so Jill can
 * do quick math while logging without leaving the page or reaching for a phone.
 *
 * Deliberately dependency-free and self-contained. Uses exact-ish JS numbers and
 * trims float fuzz on display — this is a scratch pad, not the ledger (the ledger
 * stores numeric(12,2)).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

type Op = '+' | '-' | '*' | '/'

const OP_LABEL: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' }

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b === 0 ? NaN : a / b
  }
}

// Trim binary-float fuzz for display without lying about the value.
function fmt(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  const r = Math.round((n + Number.EPSILON) * 1e10) / 1e10
  return String(r)
}

export function Calculator() {
  const [display, setDisplay] = useState('0')
  const [acc, setAcc] = useState<number | null>(null) // the running result
  const [pending, setPending] = useState<Op | null>(null) // op awaiting the next operand
  const [fresh, setFresh] = useState(true) // next digit starts a new number
  const rootRef = useRef<HTMLDivElement>(null)

  const inputDigit = useCallback((d: string) => {
    setDisplay((cur) => (fresh || cur === '0' ? (d === '.' ? '0.' : d) : cur === 'Error' ? d : cur + d))
    setFresh(false)
  }, [fresh])

  const inputDot = useCallback(() => {
    setDisplay((cur) => {
      if (fresh || cur === 'Error') return '0.'
      return cur.includes('.') ? cur : cur + '.'
    })
    setFresh(false)
  }, [fresh])

  const applyOp = useCallback((op: Op) => {
    const cur = Number(display)
    if (!Number.isFinite(cur)) return
    if (acc === null) {
      setAcc(cur)
    } else if (!fresh) {
      const res = compute(acc, cur, pending as Op)
      setAcc(res)
      setDisplay(fmt(res))
    }
    setPending(op)
    setFresh(true)
  }, [display, acc, pending, fresh])

  const equals = useCallback(() => {
    if (pending === null || acc === null) return
    const cur = Number(display)
    const res = compute(acc, cur, pending)
    setDisplay(fmt(res))
    setAcc(null)
    setPending(null)
    setFresh(true)
  }, [pending, acc, display])

  const clearAll = useCallback(() => {
    setDisplay('0'); setAcc(null); setPending(null); setFresh(true)
  }, [])

  const backspace = useCallback(() => {
    setDisplay((cur) => {
      if (fresh || cur === 'Error') return cur
      const next = cur.slice(0, -1)
      return next === '' || next === '-' ? '0' : next
    })
  }, [fresh])

  const percent = useCallback(() => {
    setDisplay((cur) => fmt(Number(cur) / 100))
    setFresh(true)
  }, [])

  const negate = useCallback(() => {
    setDisplay((cur) => (cur === '0' || cur === 'Error' ? cur : fmt(Number(cur) * -1)))
  }, [])

  // Keyboard support — only while the widget (or a control inside it) is focused,
  // so it never hijacks typing in the expense form above.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k >= '0' && k <= '9') { inputDigit(k); e.preventDefault() }
      else if (k === '.') { inputDot(); e.preventDefault() }
      else if (k === '+' || k === '-') { applyOp(k); e.preventDefault() }
      else if (k === '*') { applyOp('*'); e.preventDefault() }
      else if (k === '/') { applyOp('/'); e.preventDefault() }
      else if (k === 'Enter' || k === '=') { equals(); e.preventDefault() }
      else if (k === 'Backspace') { backspace(); e.preventDefault() }
      else if (k === 'Escape') { clearAll(); e.preventDefault() }
      else if (k === '%') { percent(); e.preventDefault() }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [inputDigit, inputDot, applyOp, equals, backspace, clearAll, percent])

  const Btn = ({ label, onClick, variant = 'num', wide = false, aria }: {
    label: React.ReactNode; onClick: () => void; variant?: 'num' | 'op' | 'fn' | 'eq'; wide?: boolean; aria?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className={`calc-key calc-${variant}${wide ? ' calc-wide' : ''}${variant === 'op' && pending && fresh ? '' : ''}`}
    >
      {label}
    </button>
  )

  return (
    <div ref={rootRef} className="calc" tabIndex={0} role="group" aria-label="Calculator">
      <div className="calc-display" aria-live="polite">
        <span className="calc-op-hint">{pending ? OP_LABEL[pending] : ' '}</span>
        <span className="calc-value">{display}</span>
      </div>
      <div className="calc-grid">
        <Btn label="AC" onClick={clearAll} variant="fn" aria="clear all" />
        <Btn label="±" onClick={negate} variant="fn" aria="negate" />
        <Btn label="%" onClick={percent} variant="fn" aria="percent" />
        <Btn label={OP_LABEL['/']} onClick={() => applyOp('/')} variant="op" aria="divide" />

        <Btn label="7" onClick={() => inputDigit('7')} />
        <Btn label="8" onClick={() => inputDigit('8')} />
        <Btn label="9" onClick={() => inputDigit('9')} />
        <Btn label={OP_LABEL['*']} onClick={() => applyOp('*')} variant="op" aria="multiply" />

        <Btn label="4" onClick={() => inputDigit('4')} />
        <Btn label="5" onClick={() => inputDigit('5')} />
        <Btn label="6" onClick={() => inputDigit('6')} />
        <Btn label={OP_LABEL['-']} onClick={() => applyOp('-')} variant="op" aria="subtract" />

        <Btn label="1" onClick={() => inputDigit('1')} />
        <Btn label="2" onClick={() => inputDigit('2')} />
        <Btn label="3" onClick={() => inputDigit('3')} />
        <Btn label={OP_LABEL['+']} onClick={() => applyOp('+')} variant="op" aria="add" />

        <Btn label="0" onClick={() => inputDigit('0')} wide />
        <Btn label="." onClick={inputDot} aria="decimal point" />
        <Btn label="=" onClick={equals} variant="eq" aria="equals" />
      </div>
      <p className="calc-hint">Tip: this widget is keyboard-friendly once focused (digits, + − * / , Enter, Esc, Backspace).</p>
    </div>
  )
}
