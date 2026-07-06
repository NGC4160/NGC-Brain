/** NGC business constants shared across the app */
export const NGC_BOOKKEEPER = 'Griffin & Furman, LLC'

export const NGC_ACCOUNTING_BASIS = 'cash' as const

export const NGC_QBO_INCOME_ACCOUNTS = {
  lithium: 'LFP Conversions Only',
  generalRepair: 'Sales and Services',
  services: 'Services Income',
  parts: 'Sales of Product Income',
  shopSupply: 'Shop Supply Fee',
} as const
