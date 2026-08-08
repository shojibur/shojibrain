"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProjectConfig = readProjectConfig;
exports.writeProjectConfig = writeProjectConfig;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../project/constants");
const schemas_1 = require("./schemas");
async function readProjectConfig(rootDir) {
    try {
        const content = await promises_1.default.readFile(node_path_1.default.join(rootDir, constants_1.PROJECT_CONFIG_FILE), "utf8");
        return schemas_1.projectConfigSchema.parse(JSON.parse(content));
    }
    catch {
        return null;
    }
}
async function writeProjectConfig(rootDir, config) {
    await promises_1.default.writeFile(node_path_1.default.join(rootDir, constants_1.PROJECT_CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
//# sourceMappingURL=project-config.js.map