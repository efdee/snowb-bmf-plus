import fs from 'fs'
import path from 'path'

import decode from './file/conversion/types/sbf/decode'
import { exportFile } from './file/export'
import { exportUnzippedFile } from './file/export/exportFile'
import textConfig from './file/export/types/text'
import { Project } from './store'

function readFileToArrayBuffer(filePath: string) {
    const buffer = fs.readFileSync(filePath)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    return arrayBuffer
}

function serializeWithGetters(obj: any) {
    const serializedObj = {} as any
    const props = Object.getOwnPropertyNames(obj)

    props.forEach((prop) => {
        const descriptor = Object.getOwnPropertyDescriptor(obj, prop)

        if (descriptor?.get) {
            try {
                serializedObj[prop] = obj[prop]
            } catch (error) {
                console.error(`Error getting value of property '${prop}':`, error)
            }
        } else if (descriptor?.value !== undefined) {
            serializedObj[prop] = obj[prop]
        }
    })

    return JSON.stringify(serializedObj, null, 2)
}

function dumpSavedFile(sbfFilePath: string) {
    const project = decode(readFileToArrayBuffer(sbfFilePath))
    console.log(serializeWithGetters(project))
}

function generateVariants(jsonOrSbfFilePath: string) {
    if (jsonOrSbfFilePath.endsWith('.sbf')) generateMainVariant(jsonOrSbfFilePath)
    else generateVariantsFromJson(jsonOrSbfFilePath)
}

function generateVariantsFromJson(jsonFilePath: string) {
    const data = fs.readFileSync(jsonFilePath, 'utf8')
    const variantsConfig = JSON.parse(data) as VariantsConfiguration
    const config = getExportConfiguration()

    const sbfFilePath = variantsConfig.base
    for (const variant of variantsConfig.variants) {
        const project = loadProject(sbfFilePath)
        applyOverrides(project, variant.override)
        const outputFilename = path.join(variantsConfig.outputPath, variant.filename)
        if (variantsConfig.output === 'files') exportUnzippedFile(project, config, variant.name, outputFilename)
        else exportFile(project, config, variant.name, outputFilename)
    }
}

function applyOverrides(objToOverride: any, overrides: any) {
    for (const key in overrides) {
        if (key.startsWith('__')) continue
        const value = overrides[key]
        if (typeof value === 'object') {
            applyOverrides(objToOverride[key], value)
        } else {
            objToOverride[key] = value
        }
    }
}

interface VariantsConfiguration {
    base: string
    output: 'files' | 'zip'
    outputPath: string
    variants: {
        name: string
        filename: string
        override: any
    }[]
}

function loadProject(sbfFilePath: string) {
    const project = decode(readFileToArrayBuffer(sbfFilePath))
    // NOTE there's some async action going on in the constructor of Font (for project.style.font)
    //      but I've changed the code so that the part that is important to us happens before the async part
    const prj = new Project(project)
    if (!prj) throw new Error('Failed to load project file: ' + sbfFilePath)
    return prj
}

function generateMainVariant(sbfFilePath: string) {
    const project = loadProject(sbfFilePath)
    const config = getExportConfiguration()
    const filenameBase = path.basename(sbfFilePath, path.extname(sbfFilePath))
    exportFile(project, config, filenameBase, filenameBase)
}

//console.log('args: ', process.argv) ['node.exe', 'cli.ts', ...]
const [nodeExec, scriptFile, command, ...args] = process.argv
switch (command.toLowerCase()) {
    case 'dump':
        dumpSavedFile(args[0])
        break
    case 'generate':
        generateVariants(args[0])
        break
}

function getExportConfiguration() {
    return {
        id: 'TEXTfnt',
        ext: 'fnt',
        type: 'TEXT',
        getString: textConfig.getString,
    }
}
//run().then(() => console.log('done'))
