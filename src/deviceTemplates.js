import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const DEFAULT_TEMPLATE_PATH = "config/device-templates.yml";

export function readDeviceTemplateSeed(templatePath = process.env.DEVICE_TEMPLATES_PATH || DEFAULT_TEMPLATE_PATH) {
  const resolvedPath = path.resolve(templatePath || DEFAULT_TEMPLATE_PATH);

  if (!fs.existsSync(resolvedPath)) {
    return {
      resolvedPath,
      templates: [],
    };
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = YAML.parse(raw) ?? {};
  const templates = Array.isArray(parsed) ? parsed : parsed.templates;

  if (!Array.isArray(templates)) {
    throw new Error(`Invalid device template seed ${resolvedPath}. Expected a templates array`);
  }

  return {
    resolvedPath,
    templates,
  };
}
