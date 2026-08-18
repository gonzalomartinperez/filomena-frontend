export function todoAMayus(cadena: string) {
  return cadena.toUpperCase()
}

export function todoAMinus(cadena: string) {
  return cadena.toLowerCase()
}

export function primerLetraAMayus(cadena: string) {
  return cadena.charAt(0).toUpperCase() + cadena.slice(1).toLowerCase()
}

export function capitalizarCadena(cadena: string) {
  return cadena
    .split(' ')
    .map((subcadena) => primerLetraAMayus(subcadena))
    .join(' ')
}

export function convertirNombre(nombre: string, apellido: string) {
  return `${capitalizarCadena(apellido)}, ${capitalizarCadena(nombre)}`
}
