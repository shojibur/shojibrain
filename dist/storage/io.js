"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeScanResult = writeScanResult;
exports.readScanResult = readScanResult;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const constants_1 = require("../project/constants");
const schemas_1 = require("./schemas");
async function writeJson(rootDir, relativePath, value) {
    await promises_1.default.writeFile(node_path_1.default.join(rootDir, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
async function readJson(rootDir, relativePath, schema) {
    const content = await promises_1.default.readFile(node_path_1.default.join(rootDir, relativePath), "utf8");
    return schema.parse(JSON.parse(content));
}
async function writeScanResult(rootDir, scan) {
    await Promise.all([
        writeJson(rootDir, constants_1.MAP_FILES.project, scan.project),
        writeJson(rootDir, constants_1.MAP_FILES.files, scan.files),
        writeJson(rootDir, constants_1.MAP_FILES.modules, scan.modules),
        writeJson(rootDir, constants_1.MAP_FILES.symbols, scan.symbols),
        writeJson(rootDir, constants_1.MAP_FILES.dependencies, scan.dependencies),
        writeJson(rootDir, constants_1.MAP_FILES.tests, scan.tests),
    ]);
}
async function readScanResult(rootDir) {
    return {
        project: await readJson(rootDir, constants_1.MAP_FILES.project, schemas_1.projectMapSchema),
        files: await readJson(rootDir, constants_1.MAP_FILES.files, zod_1.z.record(zod_1.z.string(), schemas_1.fileEntrySchema)),
        modules: await readJson(rootDir, constants_1.MAP_FILES.modules, zod_1.z.record(zod_1.z.string(), schemas_1.moduleEntrySchema)),
        symbols: await readJson(rootDir, constants_1.MAP_FILES.symbols, zod_1.z.record(zod_1.z.string(), schemas_1.symbolEntrySchema)),
        dependencies: await readJson(rootDir, constants_1.MAP_FILES.dependencies, zod_1.z.record(zod_1.z.string(), schemas_1.dependencyEntrySchema)),
        tests: await readJson(rootDir, constants_1.MAP_FILES.tests, schemas_1.testsMapSchema),
    };
}
//# sourceMappingURL=io.js.map