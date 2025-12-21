import { DetailedHTMLProps, HTMLAttributes } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'mindar-image'?: string
        'color-space'?: string
        renderer?: string
        'vr-mode-ui'?: string
        'device-orientation-permission-ui'?: string
        embedded?: boolean
      }
      'a-camera': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string
        'look-controls'?: string
      }
      'a-entity': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'mindar-image-target'?: string
        position?: string
        rotation?: string
        scale?: string
        geometry?: string
        material?: string
      }
      'a-plane': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string
        rotation?: string
        width?: string
        height?: string
        color?: string
        opacity?: string
        material?: string
      }
      'a-text': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string
        color?: string
        align?: string
        width?: string
        position?: string
        'wrap-count'?: string
        scale?: string
      }
      'a-box': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string
        rotation?: string
        color?: string
        width?: string
        height?: string
        depth?: string
      }
      'a-sphere': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string
        radius?: string
        color?: string
      }
      'a-cylinder': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string
        radius?: string
        height?: string
        color?: string
      }
      'a-image': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        position?: string
        width?: string
        height?: string
      }
      'a-assets': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
      'a-asset-item': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        id?: string
        src?: string
      }
    }
  }
}

export {}
