'use client'
import Image from 'next/image'
import { useState } from 'react'

type Props = { src?: string | null; alt?: string; name?: string | null; size?: number }

export default function Avatar(props: Props) {
  const size = props.size ?? 40
  const [error, setError] = useState(false)
  const initials = (props.name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || 'U'
  if (props.src && !error) {
    return (
      <Image
        src={props.src}
        alt={props.alt ?? 'Avatar'}
        width={size}
        height={size}
        onError={() => setError(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={props.alt ?? 'Avatar'}
    >
      {initials}
    </div>
  )
}

