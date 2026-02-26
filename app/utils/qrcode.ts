/**
 * Pure TypeScript QR Code Generator
 *
 * Generates QR codes as SVG strings. Supports byte-mode encoding
 * with error correction level L (suitable for URLs up to ~120 chars).
 *
 * Implements ISO/IEC 18004 QR Code specification (versions 1-6).
 */

// ---------------------------------------------------------------------------
// Galois Field GF(256) arithmetic for Reed-Solomon error correction
// ---------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

function initGaloisField(): void {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x = x << 1
    if (x >= 256) x ^= 0x11d // primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
}

initGaloisField()

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function gfPolyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0)
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j])
    }
  }
  return result
}

function generateECCodewords(data: number[], eccCount: number): number[] {
  // Build generator polynomial
  let generator = [1]
  for (let i = 0; i < eccCount; i++) {
    generator = gfPolyMultiply(generator, [1, GF_EXP[i]])
  }

  // Polynomial division
  const message = [...data, ...new Array(eccCount).fill(0)]
  for (let i = 0; i < data.length; i++) {
    const coef = message[i]
    if (coef !== 0) {
      for (let j = 0; j < generator.length; j++) {
        message[i + j] ^= gfMultiply(generator[j], coef)
      }
    }
  }

  return message.slice(data.length)
}

// ---------------------------------------------------------------------------
// QR code version parameters (versions 1-6, error correction level L)
// ---------------------------------------------------------------------------

interface VersionInfo {
  size: number
  totalCodewords: number
  dataCodewords: number
  ecCodewordsPerBlock: number
  numBlocks: number
  capacity: number // byte-mode capacity
}

// EC level L for versions 1-6
const VERSION_INFO: ReadonlyArray<VersionInfo> = [
  { size: 21, totalCodewords: 26, dataCodewords: 19, ecCodewordsPerBlock: 7, numBlocks: 1, capacity: 17 },
  { size: 25, totalCodewords: 44, dataCodewords: 34, ecCodewordsPerBlock: 10, numBlocks: 1, capacity: 32 },
  { size: 29, totalCodewords: 70, dataCodewords: 55, ecCodewordsPerBlock: 15, numBlocks: 1, capacity: 53 },
  { size: 33, totalCodewords: 100, dataCodewords: 80, ecCodewordsPerBlock: 20, numBlocks: 1, capacity: 78 },
  { size: 37, totalCodewords: 134, dataCodewords: 108, ecCodewordsPerBlock: 26, numBlocks: 1, capacity: 106 },
  { size: 41, totalCodewords: 172, dataCodewords: 136, ecCodewordsPerBlock: 18, numBlocks: 2, capacity: 134 },
]

// Alignment pattern center positions per version (version 1 has none)
const ALIGNMENT_POSITIONS: ReadonlyArray<ReadonlyArray<number>> = [
  [],          // version 1
  [6, 18],     // version 2
  [6, 22],     // version 3
  [6, 26],     // version 4
  [6, 30],     // version 5
  [6, 34],     // version 6
]

// ---------------------------------------------------------------------------
// Data encoding (byte mode)
// ---------------------------------------------------------------------------

function selectVersion(dataLength: number): number {
  for (let v = 0; v < VERSION_INFO.length; v++) {
    if (dataLength <= VERSION_INFO[v].capacity) return v + 1
  }
  throw new Error(`QR: data too long (${dataLength} bytes, max ${VERSION_INFO[VERSION_INFO.length - 1].capacity})`)
}

function encodeData(text: string, version: number): number[] {
  const info = VERSION_INFO[version - 1]
  const bytes = new TextEncoder().encode(text)

  // Character count indicator bit length for byte mode
  const ccBits = version <= 9 ? 8 : 16

  // Build bit stream
  const bits: number[] = []

  const pushBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((value >> i) & 1)
    }
  }

  // Mode indicator: 0100 = byte mode
  pushBits(0b0100, 4)
  // Character count
  pushBits(bytes.length, ccBits)
  // Data bytes
  for (const b of bytes) {
    pushBits(b, 8)
  }
  // Terminator (up to 4 bits of 0)
  const terminatorLen = Math.min(4, info.dataCodewords * 8 - bits.length)
  pushBits(0, terminatorLen)

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  // Convert to bytes
  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0)
    }
    codewords.push(byte)
  }

  // Pad with alternating 0xEC, 0x11
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (codewords.length < info.dataCodewords) {
    codewords.push(padBytes[padIdx % 2])
    padIdx++
  }

  return codewords
}

// ---------------------------------------------------------------------------
// Error correction and interleaving
// ---------------------------------------------------------------------------

function addErrorCorrection(data: number[], version: number): number[] {
  const info = VERSION_INFO[version - 1]
  const { numBlocks, ecCodewordsPerBlock, dataCodewords } = info

  const blockDataSize = Math.floor(dataCodewords / numBlocks)
  const remainder = dataCodewords % numBlocks

  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  let offset = 0

  for (let b = 0; b < numBlocks; b++) {
    const size = blockDataSize + (b < remainder ? 1 : 0)
    const block = data.slice(offset, offset + size)
    dataBlocks.push(block)
    ecBlocks.push(generateECCodewords(block, ecCodewordsPerBlock))
    offset += size
  }

  // Interleave data codewords
  const result: number[] = []
  const maxDataLen = Math.max(...dataBlocks.map(b => b.length))
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) result.push(block[i])
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecCodewordsPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) result.push(block[i])
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Matrix construction
// ---------------------------------------------------------------------------

type Module = 0 | 1
type Matrix = Module[][]

function createMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => new Array(size).fill(0) as Module[])
}

// Track which cells are function patterns (not data)
function createFunctionMask(size: number): boolean[][] {
  return Array.from({ length: size }, () => new Array(size).fill(false))
}

function placeFinderPattern(matrix: Matrix, mask: boolean[][], row: number, col: number): void {
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ]

  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const mr = row + r
      const mc = col + c
      if (mr >= 0 && mr < matrix.length && mc >= 0 && mc < matrix.length) {
        matrix[mr][mc] = pattern[r][c] as Module
        mask[mr][mc] = true
      }
    }
  }
}

function placeAlignmentPattern(matrix: Matrix, mask: boolean[][], centerRow: number, centerCol: number): void {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = centerRow + r
      const mc = centerCol + c
      if (mask[mr][mc]) continue // don't overwrite finder patterns
      const val = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0
      matrix[mr][mc] = val as Module
      mask[mr][mc] = true
    }
  }
}

function placeFunctionPatterns(matrix: Matrix, mask: boolean[][], version: number): void {
  const size = matrix.length

  // Finder patterns (top-left, top-right, bottom-left)
  placeFinderPattern(matrix, mask, 0, 0)
  placeFinderPattern(matrix, mask, 0, size - 7)
  placeFinderPattern(matrix, mask, size - 7, 0)

  // Separators (white border around finder patterns)
  for (let i = 0; i < 8; i++) {
    // Top-left
    if (i < size) {
      matrix[7][i] = 0; mask[7][i] = true
      matrix[i][7] = 0; mask[i][7] = true
    }
    // Top-right
    if (size - 8 + i < size) {
      matrix[7][size - 8 + i] = 0; mask[7][size - 8 + i] = true
      matrix[i][size - 8] = 0; mask[i][size - 8] = true
    }
    // Bottom-left
    if (size - 8 + i < size) {
      matrix[size - 8][i] = 0; mask[size - 8][i] = true
      matrix[size - 8 + i][7] = 0; mask[size - 8 + i][7] = true
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = (i % 2 === 0 ? 1 : 0) as Module
    matrix[6][i] = val; mask[6][i] = true
    matrix[i][6] = val; mask[i][6] = true
  }

  // Dark module
  matrix[size - 8][8] = 1
  mask[size - 8][8] = true

  // Alignment patterns
  if (version >= 2) {
    const positions = ALIGNMENT_POSITIONS[version - 1]
    for (const row of positions) {
      for (const col of positions) {
        // Skip if overlapping with finder patterns
        if (row <= 8 && col <= 8) continue
        if (row <= 8 && col >= size - 8) continue
        if (row >= size - 8 && col <= 8) continue
        placeAlignmentPattern(matrix, mask, row, col)
      }
    }
  }

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (i < size) {
      mask[8][i] = true
      mask[i][8] = true
    }
    if (size - 1 - i >= 0 && i < 8) {
      mask[8][size - 1 - i] = true
      mask[size - 1 - i][8] = true
    }
  }
}

// ---------------------------------------------------------------------------
// Data placement
// ---------------------------------------------------------------------------

function placeDataBits(matrix: Matrix, mask: boolean[][], data: number[]): void {
  const size = matrix.length

  // Convert to bit stream
  const bits: number[] = []
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1)
    }
  }

  let bitIndex = 0
  // Data is placed in 2-column strips from right to left
  // Column 6 is skipped (timing pattern)
  let col = size - 1

  while (col >= 0) {
    if (col === 6) col-- // skip timing column

    // Each strip is 2 columns wide, traversed upward then downward alternately
    const goingUp = ((size - 1 - col) / 2) % 2 === 0

    for (let rowOffset = 0; rowOffset < size; rowOffset++) {
      const row = goingUp ? size - 1 - rowOffset : rowOffset

      for (let c = 0; c < 2; c++) {
        const currentCol = col - c
        if (currentCol < 0) continue
        if (mask[row][currentCol]) continue

        if (bitIndex < bits.length) {
          matrix[row][currentCol] = bits[bitIndex] as Module
          bitIndex++
        }
        // Remaining bits stay 0 (padding)
      }
    }

    col -= 2
  }
}

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------

type MaskFunction = (row: number, col: number) => boolean

const MASK_FUNCTIONS: ReadonlyArray<MaskFunction> = [
  (r, c) => (r + c) % 2 === 0,
  (r, _) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function applyMask(matrix: Matrix, functionMask: boolean[][], maskIndex: number): Matrix {
  const size = matrix.length
  const result = createMatrix(size)
  const maskFn = MASK_FUNCTIONS[maskIndex]

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      result[r][c] = matrix[r][c]
      if (!functionMask[r][c] && maskFn(r, c)) {
        result[r][c] = (result[r][c] ^ 1) as Module
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Format information
// ---------------------------------------------------------------------------

// Format info for EC level L (01) + mask patterns 0-7
// Pre-computed with BCH(15,5) error correction and XOR mask 0x5412
const FORMAT_INFO: ReadonlyArray<number> = [
  0x77c4, // mask 0
  0x72f3, // mask 1
  0x7daa, // mask 2
  0x789d, // mask 3
  0x662f, // mask 4
  0x6318, // mask 5
  0x6c41, // mask 6
  0x6976, // mask 7
]

function placeFormatInfo(matrix: Matrix, maskIndex: number): void {
  const size = matrix.length
  const formatBits = FORMAT_INFO[maskIndex]

  // Place around top-left finder
  const positions1 = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ]

  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) as Module
    const [r, c] = positions1[i]
    matrix[r][c] = bit
  }

  // Place along bottom-left and top-right
  const positions2: [number, number][] = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ]

  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) as Module
    const [r, c] = positions2[i]
    matrix[r][c] = bit
  }
}

// ---------------------------------------------------------------------------
// Penalty scoring for mask selection
// ---------------------------------------------------------------------------

function calculatePenalty(matrix: Matrix): number {
  const size = matrix.length
  let penalty = 0

  // Rule 1: Five or more same-colored modules in a row/column
  for (let r = 0; r < size; r++) {
    let runLength = 1
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        runLength++
      } else {
        if (runLength >= 5) penalty += runLength - 2
        runLength = 1
      }
    }
    if (runLength >= 5) penalty += runLength - 2
  }

  for (let c = 0; c < size; c++) {
    let runLength = 1
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        runLength++
      } else {
        if (runLength >= 5) penalty += runLength - 2
        runLength = 1
      }
    }
    if (runLength >= 5) penalty += runLength - 2
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const val = matrix[r][c]
      if (val === matrix[r][c + 1] && val === matrix[r + 1][c] && val === matrix[r + 1][c + 1]) {
        penalty += 3
      }
    }
  }

  // Rule 3: Finder-like patterns (1011101 preceded/followed by 4 whites)
  const finder1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
  const finder2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      let match1 = true
      let match2 = true
      for (let i = 0; i < 11; i++) {
        if (matrix[r][c + i] !== finder1[i]) match1 = false
        if (matrix[r][c + i] !== finder2[i]) match2 = false
      }
      if (match1 || match2) penalty += 40
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      let match1 = true
      let match2 = true
      for (let i = 0; i < 11; i++) {
        if (matrix[r + i][c] !== finder1[i]) match1 = false
        if (matrix[r + i][c] !== finder2[i]) match2 = false
      }
      if (match1 || match2) penalty += 40
    }
  }

  // Rule 4: Proportion of dark modules
  let darkCount = 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) darkCount++
    }
  }
  const total = size * size
  const percent = (darkCount / total) * 100
  const prev5 = Math.floor(percent / 5) * 5
  const next5 = prev5 + 5
  penalty += Math.min(Math.abs(prev5 - 50) / 5, Math.abs(next5 - 50) / 5) * 10

  return penalty
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface QrMatrix {
  modules: Matrix
  size: number
}

/**
 * Encode text into a QR code module matrix.
 * Returns the matrix (1 = dark, 0 = light) and its size.
 */
export function encodeQR(text: string): QrMatrix {
  const version = selectVersion(new TextEncoder().encode(text).length)
  const info = VERSION_INFO[version - 1]
  const size = info.size

  // Encode data
  const data = encodeData(text, version)
  const codewords = addErrorCorrection(data, version)

  // Build matrix with function patterns
  const matrix = createMatrix(size)
  const functionMask = createFunctionMask(size)
  placeFunctionPatterns(matrix, functionMask, version)

  // Place data bits
  placeDataBits(matrix, functionMask, codewords)

  // Try all 8 mask patterns and pick the one with lowest penalty
  let bestMask = 0
  let bestPenalty = Infinity

  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, functionMask, m)
    placeFormatInfo(masked, m)
    const penalty = calculatePenalty(masked)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMask = m
    }
  }

  // Apply best mask to original and place format info
  const finalMatrix = applyMask(matrix, functionMask, bestMask)
  placeFormatInfo(finalMatrix, bestMask)

  return { modules: finalMatrix, size }
}

export interface QrSvgOptions {
  /** Module (pixel) size in SVG units. Default: 4 */
  moduleSize?: number
  /** Quiet zone (white border) in modules. Default: 2 */
  quietZone?: number
  /** Dark module color. Default: '#f0f0f5' (light for dark themes) */
  foreground?: string
  /** Light module / background color. Default: 'transparent' */
  background?: string
}

/**
 * Generate a QR code as an SVG string.
 */
export function generateQrSvg(text: string, options: QrSvgOptions = {}): string {
  const {
    moduleSize = 4,
    quietZone = 2,
    foreground = '#f0f0f5',
    background = 'transparent',
  } = options

  const { modules, size } = encodeQR(text)
  const totalSize = (size + quietZone * 2) * moduleSize

  const rects: string[] = []

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c] === 1) {
        const x = (c + quietZone) * moduleSize
        const y = (r + quietZone) * moduleSize
        rects.push(`<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${foreground}"/>`)
      }
    }
  }

  const bgRect = background !== 'transparent'
    ? `<rect width="${totalSize}" height="${totalSize}" fill="${background}"/>`
    : ''

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`,
    bgRect,
    ...rects,
    '</svg>',
  ].join('')
}
