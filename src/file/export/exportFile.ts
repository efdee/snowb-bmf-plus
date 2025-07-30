import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { Project } from 'src/store'
import { createCanvas } from 'src/utils/createCanvas'
import drawPackCanvas from 'src/utils/drawPackCanvas'

import toBmfInfo from './toBmfInfo'
import { ConfigItem } from './type'

export function exportUnzippedFile(project: Project, config: ConfigItem, fontName: string, fileName: string) {
    const { packCanvas, glyphList, name, layout, ui } = project
    console.log('project name', project.name)
    const bmfont = toBmfInfo(project, fontName)
    let text = config.getString(bmfont)
    const saveFileName = fileName || name

    if (name !== saveFileName) {
        text = text.replace(`file="${name}.png"`, `file="${saveFileName}.png"`)
    }

    writeFile(`${saveFileName}.${config.ext}`, text)

    let canvas = createCanvas(ui.width, ui.height)
    drawPackCanvas(canvas, packCanvas, glyphList, layout.padding)

    if (typeof window !== 'undefined') {
        canvas.toBlob((blob: any) => {
            if (blob) writeFile(`${saveFileName}.png`, blob)
        })
    } else {
        //console.log('no toBlob on canvas!')
        const buffer = canvas.toBuffer('image/png')
        writeFile(`${saveFileName}_0.png`, buffer)
    }
}

export default function exportFile(project: Project, config: ConfigItem, fontName: string, fileName: string): void {
    const zip = new JSZip()
    const { packCanvas, glyphList, name, layout, ui } = project
    const bmfont = toBmfInfo(project, fontName)
    let text = config.getString(bmfont)
    const saveFileName = fileName || name

    if (name !== saveFileName) {
        text = text.replace(`file="${name}.png"`, `file="${saveFileName}.png"`)
    }

    zip.file(`${saveFileName}.${config.ext}`, text)

    let canvas = createCanvas(ui.width, ui.height)
    drawPackCanvas(canvas, packCanvas, glyphList, layout.padding)

    if (typeof window !== 'undefined') {
        canvas.toBlob((blob: any) => {
            if (blob) zip.file(`${saveFileName}.png`, blob)
            zip.generateAsync({ type: 'blob' }).then((content) => saveAs(content, `${saveFileName}.zip`))
        })
    } else {
        //console.log('no toBlob on canvas!')
        const buffer = canvas.toBuffer('image/png')
        const fs = eval("require('fs')")
        zip.file(`${saveFileName}_0.png`, buffer)
            .generateAsync({ type: 'nodebuffer' })
            .then((content) => fs.writeFileSync(`${saveFileName}.zip`, content))
    }
}

function writeFile(filePath: string, data: any) {
    const fs = eval("require('fs')")
    fs.writeFileSync(filePath, data)
}
