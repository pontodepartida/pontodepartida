// Componentes interativos opcionais por questão.

import { comuns } from './interativos/comuns.js';
import { matematica as ps20231a } from './interativos/ps-2023-1-a-matematica.js';
import { matematica as ps20231b } from './interativos/ps-2023-1-b-matematica.js';
import { matematica as ps20241a } from './interativos/ps-2024-1-a-matematica.js';
import { matematica as ps20241b } from './interativos/ps-2024-1-b-matematica.js';
import { matematica as ps20251a } from './interativos/ps-2025-1-a-matematica.js';
import { matematica as ps20251b } from './interativos/ps-2025-1-b-matematica.js';
import { matematica as ps20261 } from './interativos/ps-2026-1-matematica.js';

export const interativos = {
  ...comuns,
  ...ps20231a,
  ...ps20231b,
  ...ps20241a,
  ...ps20241b,
  ...ps20251a,
  ...ps20251b,
  ...ps20261,
};
