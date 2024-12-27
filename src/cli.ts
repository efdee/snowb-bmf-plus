import fs from 'fs'
import path from 'path'

import decode from './file/conversion/types/sbf/decode'
import { exportFile } from './file/export'
import textConfig from './file/export/types/text'
import { Project } from './store'

function readFileToArrayBuffer(filePath: string) {
  // Read the file into a Buffer
  const buffer = fs.readFileSync(filePath)

  // Convert Buffer to ArrayBuffer
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  )

  return arrayBuffer
}

function serializeWithGetters(obj: any) {
  const serializedObj = {} as any

  // Use Object.getOwnPropertyNames to get all properties, including non-enumerable ones
  const props = Object.getOwnPropertyNames(obj)

  props.forEach((prop) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop)

    if (descriptor?.get) {
      // If the property has a getter, call it to get the value
      try {
        serializedObj[prop] = obj[prop]
      } catch (error) {
        console.error(`Error getting value of property '${prop}':`, error)
      }
    } else if (descriptor?.value !== undefined) {
      // If it's a normal property, just copy the value
      serializedObj[prop] = obj[prop]
    }
  })

  return JSON.stringify(serializedObj, null, 2)
}

// async function run() {
//   const filename = 'C:\\Users\\filip\\Downloads\\Unnamed (4).sbf'

//   const project = decode(readFileToArrayBuffer(filename))
//   //if (!project.name) project.name = filename

//   // NOTE there's some async action going on in the constructor of Font (for project.style.font)
//   //      but I've changed the code so that the part that is important to us happens before the async part
//   const prj = new Project(project)
//   //console.log(serializeWithGetters(project))

//   if (!prj) {
//     console.log('project not loaded')
//     return
//   }

//   const config = {
//     id: 'TEXTfnt',
//     ext: 'fnt',
//     type: 'TEXT',
//     getString: textConfig.getString,
//   }
//   const fontName = 'Franco Bold' //'sans-serif'
//   const fileName = 'Unnamed'
//   exportFile(prj, config, fontName, fileName)
// }

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
    //const project = decode(readFileToArrayBuffer(sbfFilePath))
    const project = loadProject(sbfFilePath)
    console.log('starting override')
    applyOverrides(project, variant.override)
    //const prj = new Project(project)
    exportFile(project, config, variant.name, variant.filename)
  }
}

function applyOverrides(objToOverride: any, overrides: any) {
  console.log('overrides', overrides)
  for (const key in overrides) {
    const value = overrides[key]
    if (typeof value === 'object') {
      console.log('override: ' + key + ' is object')
      applyOverrides(objToOverride[key], value)
    } else {
      console.log('override: ' + key + ' is value ' + value)
      objToOverride[key] = value
    }
  }
}

interface VariantsConfiguration {
  base: string
  variants: {
    name: string
    filename: string
    override: any
  }[]
}

function loadProject(sbfFilePath: string) {
  const project = decode(readFileToArrayBuffer(sbfFilePath))
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
