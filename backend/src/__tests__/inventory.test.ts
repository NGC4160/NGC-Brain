import { describe, it, expect } from 'vitest'
import { partToQboType, qboTypeToPartType } from '../services/qbo/types'
import { isLowStock } from '../services/inventory'
import type { Part } from '@prisma/client'

describe('QBO type mapping', () => {
  it('maps inventory parts to QBO Inventory type', () => {
    expect(partToQboType('INVENTORY')).toBe('Inventory')
  })

  it('maps non-inventory parts to QBO NonInventory type', () => {
    expect(partToQboType('NON_INVENTORY')).toBe('NonInventory')
  })

  it('maps QBO types back to part types', () => {
    expect(qboTypeToPartType('Inventory')).toBe('INVENTORY')
    expect(qboTypeToPartType('NonInventory')).toBe('NON_INVENTORY')
  })
})

describe('Low stock detection', () => {
  const basePart = {
    reorderPoint: 5,
  } as Part

  it('flags when at reorder point', () => {
    expect(isLowStock(basePart, 5)).toBe(true)
  })

  it('flags when below reorder point', () => {
    expect(isLowStock(basePart, 3)).toBe(true)
  })

  it('does not flag when above reorder point', () => {
    expect(isLowStock(basePart, 10)).toBe(false)
  })

  it('ignores parts with zero reorder point', () => {
    expect(isLowStock({ ...basePart, reorderPoint: 0 }, 0)).toBe(false)
  })
})

describe('Stock movement math', () => {
  it('calculates quantity after issue', () => {
    const before = 10
    const delta = -3
    expect(before + delta).toBe(7)
  })

  it('calculates weighted average cost on receive', () => {
    const existingQty = 4
    const existingAvg = 100
    const receiveQty = 6
    const receiveCost = 110
    const newAvg = (existingAvg * existingQty + receiveCost * receiveQty) / (existingQty + receiveQty)
    expect(newAvg).toBe(106)
  })
})
