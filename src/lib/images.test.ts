import { imageProblem, MAX_IMAGE_BYTES } from './images'

test('only JPEG, PNG and WebP up to 5 MB are accepted', () => {
  expect(imageProblem({ type: 'image/png', size: 1000 })).toBeNull()
  expect(imageProblem({ type: 'image/webp', size: MAX_IMAGE_BYTES })).toBeNull()
  expect(imageProblem({ type: 'image/gif', size: 1000 })).toMatch(/JPEG, PNG or WebP/)
  expect(imageProblem({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 })).toMatch(/under 5 MB/)
  expect(imageProblem({ type: 'image/jpeg', size: 0 })).toMatch(/empty/)
})
