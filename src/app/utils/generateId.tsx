export default function generateId(): string {
  const id = Math.floor(Math.random() * 10000)
  return id.toString().padStart(4, '0')
}
