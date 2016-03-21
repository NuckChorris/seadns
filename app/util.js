export function wrap() {
  const columns = Math.min(process.stdout.columns, 140)
  return this.split(' ').reduce((lines, word) => {
    let line = lines.slice(-1)
    let tryLine = `${line} ${word}`
    let newLines = (tryLine.length < columns) ? [tryLine] : [line, word]
    return [...lines.slice(0, -1), ...newLines]
  }, ['']).join("\n")
}

export function unwrap() {
  return this.replace(/([^\n])\n/g, '$1 ')
}

export function squash() {
  return this.replace(/([^\.]) +/g, '$1 ').replace(/\. (\S)/g, '.  $1')
}

export function clean() {
  return this::unwrap()::squash()::wrap()
}
