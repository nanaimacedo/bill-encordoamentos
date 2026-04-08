'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, QrCode, X, User, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ScanResult {
  tipo: 'cliente' | 'raquete'
  cliente: {
    id: string
    nome: string
    telefone: string
    condominio: string | null
    apartamento: string | null
    encordoamentos: {
      id: string
      tensao: number
      preco: number
      status: string
      createdAt: string
      corda: { nome: string; marca: string }
    }[]
    raquetes: { id: string; marca: string; modelo: string }[]
  }
  raquete?: { id: string; marca: string; modelo: string }
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCamera = async () => {
    try {
      setError('')
      setResult(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      startScanning()
    } catch {
      setError('Não foi possível acessar a câmera. Use o código manual.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setScanning(false)
  }

  const startScanning = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          // @ts-expect-error BarcodeDetector not in TS types
          const detector = new BarcodeDetector({ formats: ['qr_code'] })
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            const url = barcodes[0].rawValue
            const code = extractCodeFromUrl(url)
            if (code) {
              stopCamera()
              await lookupCode(code)
            }
          }
        } catch {
          // BarcodeDetector failed, silently continue
        }
      }
    }, 500)
  }

  const extractCodeFromUrl = (url: string): string | null => {
    // Handle full URLs like http://localhost:3000/scan/abc123
    const match = url.match(/\/scan\/([^/?]+)/)
    if (match) return match[1]
    // Handle plain codes
    if (url.length > 8 && !url.includes('/')) return url
    return null
  }

  const lookupCode = async (code: string) => {
    try {
      setError('')
      const res = await fetch(`/api/qrcode/scan/${code}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        setError('QR Code não encontrado. Verifique e tente novamente.')
      }
    } catch {
      setError('Erro ao buscar dados.')
    }
  }

  const handleManualSearch = () => {
    if (!manualCode.trim()) return
    const code = extractCodeFromUrl(manualCode.trim()) || manualCode.trim()
    lookupCode(code)
  }

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <QrCode className="w-6 h-6" /> Scanner QR Code
      </h1>

      {!result ? (
        <>
          {/* Camera view */}
          {scanning ? (
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full" playsInline />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay with scan area */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 sm:w-48 sm:h-48 border-2 border-white rounded-2xl opacity-60" />
              </div>
              <button
                onClick={stopCamera}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm bg-black/30 py-2">
                Aponte para o QR Code
              </p>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center gap-3 text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
            >
              <Camera className="w-10 h-10" />
              <span className="font-medium">Abrir Câmera</span>
              <span className="text-xs">Escaneie o QR Code do cliente ou raquete</span>
            </button>
          )}

          {/* Manual code input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou digite o código</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
              placeholder="Cole o código ou URL aqui..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleManualSearch}
              className="px-4 py-3 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700"
            >
              Buscar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Result */}
          <div className="bg-green-50 rounded-xl p-1 text-center">
            <span className="text-xs font-medium text-green-700">
              {result.tipo === 'raquete' ? 'Raquete encontrada' : 'Cliente encontrado'}
            </span>
          </div>

          {result.raquete && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold uppercase">Raquete</p>
              <p className="font-medium text-blue-800">{result.raquete.marca} {result.raquete.modelo}</p>
            </div>
          )}

          {/* Client info */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-800">{result.cliente.nome}</h2>
              </div>
              <Link
                href={`/clientes/${result.cliente.id}`}
                className="text-xs text-green-600 flex items-center gap-1 hover:underline"
              >
                Ver perfil <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-sm text-gray-600">{result.cliente.telefone}</p>
            {result.cliente.condominio && (
              <p className="text-sm text-gray-500">
                {result.cliente.condominio} {result.cliente.apartamento && `- Apt ${result.cliente.apartamento}`}
              </p>
            )}
          </div>

          {/* Raquetes */}
          {result.cliente.raquetes.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Raquetes</h3>
              {result.cliente.raquetes.map(r => (
                <div key={r.id} className="text-sm text-gray-700">
                  {r.marca} {r.modelo}
                </div>
              ))}
            </div>
          )}

          {/* Recent encordoamentos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Últimos Encordoamentos
            </h3>
            <div className="space-y-2">
              {result.cliente.encordoamentos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">Nenhum encordoamento</p>
              ) : (
                result.cliente.encordoamentos.slice(0, 5).map(enc => (
                  <div key={enc.id} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{enc.corda.nome}</span>
                      <span className="text-xs text-gray-400">{formatDate(enc.createdAt)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {enc.tensao}lbs - {formatCurrency(enc.preco)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setResult(null); setManualCode('') }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
            >
              Novo Scan
            </button>
            <Link
              href={`/encordoamento?clienteId=${result.cliente.id}`}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-medium text-center hover:bg-green-700"
            >
              Nova Venda
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
