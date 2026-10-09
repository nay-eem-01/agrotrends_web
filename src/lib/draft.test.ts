import { clearLocalDraft, isBlank, loadLocalDraft, saveLocalDraft } from './draft'

beforeEach(() => localStorage.clear())

test('a draft survives a reload and is cleared on request', () => {
  saveLocalDraft({ title: 'Boro', html: '<p>Transplant early.</p>' }, 1000)
  expect(loadLocalDraft()).toEqual({ title: 'Boro', html: '<p>Transplant early.</p>', savedAt: 1000 })
  clearLocalDraft()
  expect(loadLocalDraft()).toBeNull()
})

test('an empty draft is not kept', () => {
  saveLocalDraft({ title: 'x', html: '' })
  saveLocalDraft({ title: '  ', html: '<p></p>' })
  expect(loadLocalDraft()).toBeNull()
})

test('blank means no title, no text and no image', () => {
  expect(isBlank({ title: '', html: '<p></p>' })).toBe(true)
  expect(isBlank({ title: '', html: '<p><img src="/a.png"></p>' })).toBe(false)
  expect(isBlank({ title: 'T', html: '' })).toBe(false)
})

test('corrupt storage reads as no draft', () => {
  localStorage.setItem('agrotrends.draft.new', '{oops')
  expect(loadLocalDraft()).toBeNull()
})
