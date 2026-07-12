import { type SchemaTypeDefinition } from 'sanity'
import { aboutPage } from './aboutPage'
import { gallery } from './gallery'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [gallery, aboutPage],
}
