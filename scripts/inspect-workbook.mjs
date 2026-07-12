import ExcelJS from 'exceljs'

const filePath = process.argv[2]
if (!filePath) throw new Error('请提供 xlsx 文件路径')

const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(filePath)

const textOf = (cell) => {
  const value = cell.value
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('text' in value) return value.text || ''
    if ('richText' in value) return value.richText.map((part) => part.text).join('')
    if ('result' in value) return String(value.result ?? '')
    if ('hyperlink' in value) return value.text || value.hyperlink || ''
  }
  return String(value)
}

const result = workbook.worksheets.map((sheet) => {
  const nonEmptyRows = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = []
    for (let column = 1; column <= sheet.columnCount; column += 1) values.push(textOf(row.getCell(column)).trim())
    if (values.some(Boolean)) nonEmptyRows.push({ rowNumber, values })
  })

  return {
    name: sheet.name,
    rowCount: sheet.rowCount,
    columnCount: sheet.columnCount,
    nonEmptyRowCount: nonEmptyRows.length,
    firstRows: nonEmptyRows.slice(0, 6),
  }
})

console.log(JSON.stringify(result, null, 2))
