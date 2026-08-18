'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Fuse from 'fuse.js'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import type { Usuario } from 'app/inicio/administrador/usuarios/types/Usuario'
import { getUsuarios } from 'app/inicio/administrador/usuarios/services/usuariosServices'
import Tooltip from 'app/components/tooltip/Tooltip'
import { Button } from 'app/components/buttons/GeneralButton'

type Props = {
  onPick: (user: Usuario) => void
  buttonText?: string
  preloadUsers?: Usuario[]
  maxResults?: number
}

function highlightMatch(
  text: string,
  indices: readonly [number, number][],
): React.ReactNode {
  if (!indices || indices.length === 0) return text
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  indices.forEach(([start, end], idx) => {
    if (start > lastIndex) {
      parts.push(
        <span key={`n-${idx}-${lastIndex}`}>
          {text.slice(lastIndex, start)}
        </span>,
      )
    }
    parts.push(
      <mark
        key={`m-${idx}-${start}`}
        className="rounded-sm bg-emerald-100 px-0.5 py-0 text-emerald-900"
      >
        {text.slice(start, end + 1)}
      </mark>,
    )
    lastIndex = end + 1
  })
  if (lastIndex < text.length) {
    parts.push(<span key={`t-end-${lastIndex}`}>{text.slice(lastIndex)}</span>)
  }
  return parts
}

export default function UserPicker({
  onPick,
  buttonText = 'Buscar usuario existente',
  preloadUsers,
  maxResults = 30,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Usuario[]>(preloadUsers ?? [])
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const fuse = useMemo(
    () =>
      new Fuse(users, {
        keys: [
          { name: 'usuario', weight: 0.35 },
          { name: 'nombre', weight: 0.3 },
          { name: 'apellido', weight: 0.3 },
          { name: 'dni', weight: 0.2 },
          { name: 'legajo', weight: 0.2 },
          { name: 'email', weight: 0.25 },
        ],
        threshold: 0.34,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
        includeMatches: true,
        shouldSort: true,
      }),
    [users],
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return fuse.search(q, { limit: maxResults })
  }, [fuse, query, maxResults])

  const handlePick = useCallback(
    (u: Usuario) => {
      onPick(u)
      setOpen(false)
      setQuery('')
      setActiveIndex(-1)
    },
    [onPick],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const next = Math.min(prev + 1, results.length - 1)
        scrollIntoView(next)
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const next = Math.max(prev - 1, 0)
        scrollIntoView(next)
        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const picked = results[activeIndex]?.item
      if (picked) handlePick(picked)
    }
  }

  const scrollIntoView = (idx: number) => {
    const ul = listRef.current
    if (!ul) return
    const li = ul.querySelector<HTMLLIElement>(`li[data-idx="${idx}"]`)
    if (li) li.scrollIntoView({ block: 'nearest' })
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      if (users.length > 0) {
        window.setTimeout(() => inputRef.current?.focus(), 10)
        return
      }

      setLoading(true)
      void getUsuarios()
        .then((response) => setUsers((response.data?.data as Usuario[]) ?? []))
        .finally(() => {
          setLoading(false)
          window.setTimeout(() => inputRef.current?.focus(), 10)
        })
      return
    }

    setQuery('')
    setActiveIndex(-1)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Tooltip
        title="Autocompletar"
        content="Buscá un usuario existente para completar el formulario."
        variant="info"
        side="bottom"
      >
        <Dialog.Trigger asChild>
          <Button variant="default" icon={faUser}>
            {buttonText}
          </Button>
        </Dialog.Trigger>
      </Tooltip>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fadeIn fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className={[
            'fixed top-1/2 left-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl bg-white shadow-2xl ring-1 ring-black/10',
          ].join(' ')}
        >
          <Dialog.Title className="px-5 pt-5 text-lg font-semibold text-emerald-700">
            Buscar usuario
          </Dialog.Title>
          <Dialog.Description className="px-5 text-sm text-slate-600">
            Escribí para encontrar usuarios existentes por usuario, nombre,
            apellido, DNI, legajo o email.
          </Dialog.Description>

          <div className="space-y-3 px-5 pt-3 pb-5">
            <div className="relative">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Juan Pérez, 40123456, jperez…"
                aria-label="Buscar usuarios"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-2 ring-transparent outline-none focus:ring-emerald-500"
              />
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-lg border border-slate-200">
              {loading && (
                <div className="p-4 text-sm text-slate-500">
                  Cargando usuarios…
                </div>
              )}
              {!loading && !query.trim() && (
                <div className="p-4 text-sm text-slate-500">
                  Empezá a tipear para ver resultados.
                </div>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <div className="p-4 text-sm text-slate-500">
                  Sin resultados.
                </div>
              )}

              <ul ref={listRef} className="divide-y">
                {results.map((r, idx) => {
                  const u = r.item
                  const matchFor = (key: keyof Usuario) =>
                    r.matches?.find((m) => m.key === key)?.indices ?? []

                  const isActive = idx === activeIndex
                  return (
                    <li
                      key={u.id}
                      data-idx={idx}
                      className={isActive ? 'bg-emerald-50' : ''}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handlePick(u)}
                        className={[
                          'block w-full text-left hover:cursor-pointer focus:outline-none',
                          isActive ? 'bg-emerald-50' : 'hover:bg-emerald-50',
                        ].join(' ')}
                      >
                        <div className="px-3 py-2">
                          <div className="text-sm font-medium text-slate-900">
                            {highlightMatch(
                              `${u.nombre ?? ''}`,
                              matchFor('nombre'),
                            )}{' '}
                            {highlightMatch(
                              `${u.apellido ?? ''}`,
                              matchFor('apellido'),
                            )}{' '}
                            <span className="text-slate-500">· </span>
                            <span className="text-slate-600">
                              {highlightMatch(
                                `${u.usuario ?? ''}`,
                                matchFor('usuario'),
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            DNI{' '}
                            {highlightMatch(`${u.dni ?? ''}`, matchFor('dni'))}
                            <span className="mx-1 text-slate-400">·</span>
                            Legajo{' '}
                            {highlightMatch(
                              `${u.legajo ?? ''}`,
                              matchFor('legajo'),
                            )}
                            <span className="mx-1 text-slate-400">·</span>
                            {highlightMatch(
                              `${u.email ?? ''}`,
                              matchFor('email'),
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex justify-end pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  Cerrar
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>

        {/* Animación simple */}
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .data-[state='open']:animate-fadein {
            animation: fadeIn 120ms ease-out;
          }
        `}</style>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
