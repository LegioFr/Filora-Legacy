import { readFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { expect, type Locator, type Page } from '@playwright/test'

export interface BackupReference {
  id: string
  brand: string
  material: string
  diameterMm: number
  manufacturerType: string | null
  manufacturerColor: string | null
  colorHex: string | null
  nominalWeightGrams: number
  nozzleTemperatureC: { min: number; max: number } | null
  bedTemperatureC: { min: number; max: number } | null
  printSettings: Record<string, number | null>
}

export interface BackupSpool {
  id: string
  filamentReferenceId: string | null
  locationId: string | null
  purchaseDate: string | null
  openDate: string | null
  supplier: string | null
  purchasePriceEuros: number | null
  lastDriedDate: string | null
  purchaseUrl: string | null
  supportKind: 'original' | 'reusable' | null
  tareWeightGrams: number | null
  tareSource: 'measured_empty_support' | 'manufacturer' | null
  grossMeasuredWeightGrams: number | null
  stockBasis: 'nominal' | 'measured'
  preferredNozzleTemperatureC: number | null
  preferredBedTemperatureC: number | null
  notes: string | null
}

export interface InventoryBackup {
  format: string
  version: number
  filamentReferences: BackupReference[]
  locations: Array<{ id: string; name: string }>
  spools: BackupSpool[]
}

export async function openApp(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible()
}

export async function goToStock(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: /Stock$/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Stock de bobines' })).toBeVisible()
}

export async function goToSettings(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: /Réglages$/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible()
}

export async function openCreateDialog(page: Page): Promise<Locator> {
  await goToStock(page)
  await page.getByRole('button', { name: 'Ajouter une bobine' }).click()
  const dialog = page.getByRole('dialog', { name: 'Créer une ou plusieurs bobines' })
  await expect(dialog).toBeVisible()
  return dialog
}

export function sectionToggle(dialog: Locator, title: string): Locator {
  return dialog.getByRole('button', { name: new RegExp(`${title}[+−]?$`) })
}

export async function setSectionOpen(dialog: Locator, title: string, open = true): Promise<void> {
  const toggle = sectionToggle(dialog, title)
  const expanded = await toggle.getAttribute('aria-expanded')
  if ((expanded === 'true') !== open) await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', String(open))
}

export function field(dialog: Locator, label: string): Locator {
  return dialog.locator('label').filter({ hasText: label }).first()
}

export function fieldInput(dialog: Locator, label: string): Locator {
  return field(dialog, label).locator('input, textarea, select').first()
}

function ariaCatalog(dialog: Locator, label: string): Locator {
  return dialog.locator('summary').and(dialog.getByLabel(label, { exact: true }))
}

export async function chooseAriaCatalogOption(dialog: Locator, label: string, option: string): Promise<void> {
  const summary = ariaCatalog(dialog, label)
  await summary.click()
  await dialog.getByRole('option', { name: option, exact: true }).click()
  await expect(summary).toContainText(option)
}

export async function addCustomAriaCatalogOption(
  dialog: Locator,
  label: string,
  placeholder: string,
  value: string,
): Promise<void> {
  const summary = ariaCatalog(dialog, label)
  await summary.click()
  const details = summary.locator('..')
  await details.getByPlaceholder(placeholder).fill(value)
  await details.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(summary).toContainText(value)
}

export async function chooseFieldCatalogOption(dialog: Locator, label: string, option: string): Promise<void> {
  const container = field(dialog, label)
  const summary = container.locator('summary')
  await summary.click()
  await container.getByRole('option', { name: option, exact: true }).click()
  await expect(summary).toContainText(option)
}

export async function addCustomFieldCatalogOption(
  dialog: Locator,
  label: string,
  placeholder: string,
  value: string,
): Promise<void> {
  const container = field(dialog, label)
  const summary = container.locator('summary')
  await summary.click()
  await container.getByPlaceholder(placeholder).fill(value)
  await container.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(summary).toContainText(value)
}

export interface ReferenceInput {
  brand?: string
  material?: string
  diameter?: string
  manufacturerType?: string
  manufacturerColor?: string
  nominalWeight?: string
}

export async function fillNewReference(dialog: Locator, input: ReferenceInput = {}): Promise<void> {
  await setSectionOpen(dialog, 'Filament')
  await chooseAriaCatalogOption(dialog, 'Marque', input.brand ?? 'Bambu Lab')
  if (input.material) await chooseAriaCatalogOption(dialog, 'Matière', input.material)
  if (input.diameter) await chooseAriaCatalogOption(dialog, 'Diamètre', input.diameter)
  if (input.manufacturerType) {
    await chooseAriaCatalogOption(dialog, 'Gamme ou type de filament fabricant', input.manufacturerType)
  }
  if (input.manufacturerColor) {
    await chooseAriaCatalogOption(dialog, 'Couleur fabricant', input.manufacturerColor)
  }
  if (input.nominalWeight) await chooseAriaCatalogOption(dialog, 'Poids nominal', input.nominalWeight)
}

export async function fillSeries(
  dialog: Locator,
  { id, quantity = 1, notes }: { id?: string; quantity?: number; notes?: string },
): Promise<void> {
  await setSectionOpen(dialog, 'Exemplaires physiques')
  await fieldInput(dialog, 'Nombre de bobines').fill(String(quantity))
  if (id !== undefined) await fieldInput(dialog, 'Premier ID personnalisé').fill(id)
  if (notes !== undefined) await fieldInput(dialog, 'Notes').fill(notes)
}

export async function selectExistingReference(dialog: Locator, optionLabel: string): Promise<void> {
  await setSectionOpen(dialog, 'Filament')
  await dialog.getByRole('button', { name: 'Référence existante', exact: true }).click()
  await fieldInput(dialog, 'Référence filament').selectOption({ label: optionLabel })
}

export async function fillMeasuredStock(
  dialog: Locator,
  { tare, gross, support = 'original' }: { tare: string; gross: string; support?: 'original' | 'reusable' },
): Promise<void> {
  await setSectionOpen(dialog, 'Quantité de filament')
  await dialog.getByRole('button', { name: /Je viens de la peser/ }).click()
  await fieldInput(dialog, 'Type de support').selectOption(support)
  await fieldInput(dialog, 'Poids de la bobine vide').fill(tare)
  await fieldInput(dialog, 'Poids total sur la balance').fill(gross)
}

export async function submitCreation(page: Page, dialog: Locator, quantity = 1): Promise<void> {
  const label = `Enregistrer ${quantity} bobine${quantity > 1 ? 's' : ''}`
  await dialog.getByRole('button', { name: label, exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('status')).toContainText(`${quantity} bobine${quantity > 1 ? 's' : ''} enregistrée`)
}

export interface CreateSpoolInput extends ReferenceInput {
  id: string
  quantity?: number
  notes?: string
  existingReferenceLabel?: string
  measured?: { tare: string; gross: string }
  support?: 'original' | 'reusable'
}

export async function createSpool(page: Page, input: CreateSpoolInput): Promise<Locator[]> {
  const dialog = await openCreateDialog(page)
  if (input.existingReferenceLabel) {
    await selectExistingReference(dialog, input.existingReferenceLabel)
  } else {
    await fillNewReference(dialog, input)
  }
  if (input.measured) {
    await fillMeasuredStock(dialog, { ...input.measured, support: input.support })
  } else if (input.support) {
    await setSectionOpen(dialog, 'Quantité de filament')
    await fieldInput(dialog, 'Type de support').selectOption(input.support)
  }
  await fillSeries(dialog, { id: input.id, quantity: input.quantity, notes: input.notes })
  await submitCreation(page, dialog, input.quantity ?? 1)
  const ids = [input.id]
  if ((input.quantity ?? 1) > 1) {
    const automatic = await page.locator('article .stock-meta dd').allTextContents()
    ids.push(...automatic.filter((id) => /^SP-\d{4}$/.test(id)))
  }
  const cards = ids.map((id) => stockCard(page, id))
  await Promise.all(cards.map((card) => expect(card).toBeVisible()))
  return cards
}

export function stockCard(page: Page, id: string): Locator {
  return page.locator('article').filter({ hasText: id })
}

export async function expectStockCount(page: Page, count: number): Promise<void> {
  await expect(page.locator('article.stock-card')).toHaveCount(count)
  await expect(page.locator('.sidebar-stats').getByText('Bobines', { exact: true }).locator('..').locator('strong')).toHaveText(String(count))
}

export async function downloadBackup(page: Page): Promise<InventoryBackup> {
  await goToSettings(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger la sauvegarde' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^filora-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const path = await download.path()
  if (!path) throw new Error('Playwright did not expose the downloaded backup path')
  const backup = JSON.parse(await readFile(path, 'utf8')) as InventoryBackup
  return backup
}

export async function uploadBackup(page: Page, content: string, name = 'backup.json'): Promise<void> {
  await goToSettings(page)
  await page.getByLabel('Choisir une sauvegarde').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  })
}
