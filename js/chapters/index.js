// The box and its chapters, in reading order.
import pressure from './pressure.js';
import types from './types.js';
import embankment from './embankment.js';
import power from './power.js';
import floods from './floods.js';
import failure from './failure.js';

export const BOX = { slug: 'damclear', title: "DamClear" };
export const CHAPTERS = [pressure, types, embankment, power, floods, failure];
