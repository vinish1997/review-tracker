import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function DropdownPortal({ open, anchorRef, onClose, children, align = 'right', preferred = 'up', offset = 8, className = '' }) {
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, visible: false })

  const compute = () => {
    const anchor = anchorRef?.current
    const menu = menuRef.current
    if (!anchor || !menu) return
    const rect = anchor.getBoundingClientRect()
    // ensure menu is rendered to measure size
    const mh = menu.offsetHeight || 0
    const mw = menu.offsetWidth || 0
    const vw = window.innerWidth
    const vh = window.innerHeight
    const spaceAbove = rect.top
    const spaceBelow = vh - rect.bottom
    let openUp = false
    if (preferred === 'up') {
      openUp = (mh + offset <= spaceAbove) || (spaceAbove >= spaceBelow)
    } else {
      openUp = (mh + offset > spaceBelow) && (spaceAbove > spaceBelow)
    }
    let top = openUp ? (rect.top - mh - offset) : (rect.bottom + offset)
    let left
    if (align === 'right') {
      left = rect.right - mw
    } else {
      left = rect.left
    }
    // clamp to viewport with small padding
    const pad = 8
    top = Math.max(pad, Math.min(vh - mh - pad, top))
    left = Math.max(pad, Math.min(vw - mw - pad, left))
    setPos({ top, left, visible: true })
  }

  useLayoutEffect(() => {
    if (!open) return
    compute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onResize = () => compute()
    const onScroll = () => compute()
    const onDown = (e) => {
      const a = anchorRef?.current
      const m = menuRef.current
      if (!m) return
      if (m.contains(e.target) || (a && a.contains(e.target))) return
      onClose?.()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null
  return createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000, visibility: pos.visible ? 'visible' : 'hidden' }}
      className={`bg-white border shadow-lg rounded-md ${className}`}
      role="menu"
      aria-orientation="vertical"
      onMouseDown={(e) => { e.stopPropagation(); }}
      onClick={(e) => { e.stopPropagation(); }}
    >
      {children}
    </div>,
    document.body
  )
}
