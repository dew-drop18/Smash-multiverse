(() => {
  const width = 32;
  const height = 60;
  const spriteCache = new WeakMap();

  function expandSprite(sprite) {
    let cached = spriteCache.get(sprite);
    if (cached) return cached;
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));
    sprite.forEach((row, sourceY) => {
      const offset = Math.floor((16 - row.length) / 2);
      for (let x = 0; x < row.length; x++) {
        const pixel = row[x];
        if (pixel === '.') continue;
        const sourceX = x + offset;
        const detail = pixel === 'R' && (sourceX + sourceY) % 4 === 0 ? 'L' : pixel === 'M' && (sourceX + sourceY) % 5 === 0 ? 'A' : pixel;
        const left = sourceX * 2;
        const top = sourceY * 2;
        grid[top][left] = pixel;
        grid[top][left + 1] = detail;
        grid[top + 1][left] = pixel;
        grid[top + 1][left + 1] = pixel;
      }
    });
    cached = grid.map(row => row.join(''));
    spriteCache.set(sprite, cached);
    return cached;
  }

  function paintRect(grid, x, y, rectWidth, rectHeight, color) {
    for (let row = y; row < y + rectHeight; row++) {
      for (let column = x; column < x + rectWidth; column++) {
        if (row >= 0 && row < height && column >= 0 && column < width) grid[row][column] = color;
      }
    }
  }

  function clearArms(grid) {
    for (let y = 28; y < 42; y++) {
      for (let x = 0; x < 8; x++) grid[y][x] = '.';
      for (let x = 24; x < width; x++) grid[y][x] = '.';
    }
  }

  function paintArms(grid, state, frame) {
    clearArms(grid);
    if (state === 'running') {
      const forward = frame === 0;
      paintRect(grid, forward ? 3 : 24, 30, 5, 4, 'M');
      paintRect(grid, forward ? 1 : 27, forward ? 34 : 33, 4, 5, 'M');
      paintRect(grid, forward ? 24 : 3, 32, 5, 4, 'M');
      paintRect(grid, forward ? 27 : 1, forward ? 35 : 34, 4, 5, 'M');
    } else if (state === 'jumping') {
      paintRect(grid, 4, 27, 4, 4, 'M'); paintRect(grid, 1, 21, 4, 7, 'M');
      paintRect(grid, 24, 27, 4, 4, 'M'); paintRect(grid, 27, 21, 4, 7, 'M');
    } else if (state === 'falling') {
      paintRect(grid, 1, 30, 7, 4, 'M'); paintRect(grid, 0, 33, 5, 4, 'M');
      paintRect(grid, 24, 30, 7, 4, 'M'); paintRect(grid, 27, 33, 5, 4, 'M');
    } else if (state === 'hit') {
      paintRect(grid, 2, 29, 6, 4, 'M'); paintRect(grid, 0, 26, 4, 4, 'M');
      paintRect(grid, 24, 31, 5, 4, 'M'); paintRect(grid, 28, 35, 4, 5, 'M');
    }
  }

  function clearLegs(grid) {
    for (let y = 40; y < height; y++) grid[y].fill('.');
  }

  function paintLegs(grid, state, frame) {
    clearLegs(grid);
    paintRect(grid, 10, 40, 12, 4, 'M');
    if (state === 'running') {
      const forward = frame === 0;
      paintRect(grid, forward ? 8 : 18, 44, 6, 6, 'M');
      paintRect(grid, forward ? 4 : 22, 50, 5, 7, 'M');
      paintRect(grid, forward ? 2 : 23, 57, 7, 3, 'M');
      paintRect(grid, forward ? 18 : 8, 44, 6, 5, 'M');
      paintRect(grid, forward ? 22 : 9, 49, 6, 7, 'M');
      paintRect(grid, forward ? 23 : 2, 56, 7, 3, 'M');
    } else if (state === 'jumping') {
      paintRect(grid, 7, 44, 7, 5, 'M'); paintRect(grid, 17, 44, 7, 5, 'M');
      paintRect(grid, 12, 49, 7, 5, 'M'); paintRect(grid, 19, 51, 7, 5, 'M');
      paintRect(grid, 10, 54, 8, 4, 'M'); paintRect(grid, 23, 55, 7, 3, 'M');
    } else if (state === 'falling') {
      paintRect(grid, 7, 44, 7, 6, 'M'); paintRect(grid, 18, 44, 7, 6, 'M');
      paintRect(grid, 2, 50, 8, 6, 'M'); paintRect(grid, 22, 50, 8, 6, 'M');
      paintRect(grid, 0, 56, 9, 4, 'M'); paintRect(grid, 23, 56, 9, 4, 'M');
    } else if (state === 'hit') {
      paintRect(grid, 8, 44, 7, 8, 'M'); paintRect(grid, 17, 44, 7, 8, 'M');
      paintRect(grid, 6, 52, 8, 8, 'M'); paintRect(grid, 18, 52, 8, 8, 'M');
    }
  }

  function paintDirectionalCombo(grid, mask, frame, facing) {
    const left = Boolean(mask & 1), right = Boolean(mask & 2);
    const up = Boolean(mask & 4), down = Boolean(mask & 8);
    const direction = facing < 0 ? -1 : 1;
    const leadX = direction > 0 ? 23 : 5;
    const rearX = direction > 0 ? 5 : 23;
    clearArms(grid);
    clearLegs(grid);
    paintRect(grid, 10, 40, 12, 4, 'M');

    if (left && right) {
      paintRect(grid, 0, up ? 25 : down ? 33 : 29, 10, 5, 'M');
      paintRect(grid, 22, up ? 25 : down ? 33 : 29, 10, 5, 'M');
      paintRect(grid, 0, up ? 20 : down ? 37 : 26, 5, 5, 'R');
      paintRect(grid, 27, up ? 20 : down ? 37 : 26, 5, 5, 'R');
    } else {
      paintRect(grid, rearX, down ? 35 : 32, 5, 6, 'M');
      if (up) {
        paintRect(grid, leadX, 26, 5, 6, 'M');
        paintRect(grid, direction > 0 ? 25 : 3, 19 - frame * 2, 4, 9, 'M');
        paintRect(grid, direction > 0 ? 24 : 2, 15 - frame * 2, 6, 5, 'R');
      } else {
        const extendLeft = left && !right;
        const fistX = extendLeft ? 0 : 28;
        paintRect(grid, leadX, down ? 34 : 29, 6, 5, 'M');
        paintRect(grid, extendLeft ? 5 : 23, down ? 35 : 30, 8, 4, 'M');
        paintRect(grid, fistX, down ? 36 : 29 + frame, 7, 5, 'R');
      }
    }

    if (down) {
      paintRect(grid, 7, 42, 17, 7, 'M');
      paintRect(grid, left ? 1 : 7, 48, 12, 5, 'M');
      paintRect(grid, right ? 19 : 13, 49, 12, 5, 'M');
      paintRect(grid, left ? 0 : 6, 54, 9, 5, 'M');
      paintRect(grid, right ? 23 : 16, 55, 9, 4, 'M');
    } else if (up) {
      paintRect(grid, 8, 43, 7, 6, 'M'); paintRect(grid, 18, 43, 7, 6, 'M');
      paintRect(grid, left ? 3 : 8, 49, 9, 7, 'M');
      paintRect(grid, right ? 20 : 16, 49, 9, 7, 'M');
      paintRect(grid, left ? 1 : 7, 56, 9, 3, 'M');
      paintRect(grid, right ? 22 : 16, 56, 9, 3, 'M');
    } else if (left && right) {
      paintRect(grid, 5, 44, 9, 7, 'M'); paintRect(grid, 18, 44, 9, 7, 'M');
      paintRect(grid, 1, 51, 10, 8, 'M'); paintRect(grid, 21, 51, 10, 8, 'M');
    } else {
      const kickLeft = left && !right;
      paintRect(grid, kickLeft ? 17 : 7, 43, 8, 7, 'M');
      paintRect(grid, kickLeft ? 22 : 2, 49 + frame, 8, 6, 'M');
      paintRect(grid, kickLeft ? 23 : 1, 56, 9, 3, 'R');
      paintRect(grid, kickLeft ? 5 : 18, 44, 8, 8, 'M');
      paintRect(grid, kickLeft ? 1 : 22, 52, 8, 7, 'M');
    }
  }

  function paintAttack(grid, type, frame, facing, combo = 0) {
    if (type === 'combo' || type === 'basketball') {
      paintDirectionalCombo(grid, combo, frame, facing);
      return;
    }
    const direction = facing < 0 ? -1 : 1;
    const shoulder = direction > 0 ? 23 : 5;
    const rearShoulder = direction > 0 ? 5 : 23;
    clearArms(grid);
    clearLegs(grid);
    paintRect(grid, 10, 40, 12, 4, 'M');

    if (type === 'grill') {
      paintRect(grid, 6, 30, 7, 5, 'M'); paintRect(grid, 19, 30, 7, 5, 'M');
      paintRect(grid, 4, 34, 8, 4, 'M'); paintRect(grid, 20, 34, 8, 4, 'M');
      paintRect(grid, 6, 43, 9, 7, 'M'); paintRect(grid, 17, 43, 9, 7, 'M');
      paintRect(grid, 4, 50, 10, 9, 'M'); paintRect(grid, 18, 50, 10, 9, 'M');
      return;
    }

    if (type === 'sweep' || type === 'bouncePass') {
      paintRect(grid, shoulder, 31, 5, 5, 'M');
      paintRect(grid, rearShoulder, 30, 5, 5, 'M');
      paintRect(grid, 8, 44, 8, 5, 'M');
      paintRect(grid, 15, 47, 8, 5, 'M');
      paintRect(grid, 21, 51, 10, 4, 'M');
      paintRect(grid, 6, 49, 8, 6, 'M');
      return;
    }

    if (type === 'uppercut' || type === 'jumpShot' || type === 'kiBlastUp') {
      paintRect(grid, shoulder, 27, 5, 7, 'M');
      paintRect(grid, direction > 0 ? 25 : 3, 21, 4, 8, 'M');
      paintRect(grid, direction > 0 ? 26 : 2, 14 - frame * 2, 4, 9, 'M');
      paintRect(grid, direction > 0 ? 25 : 1, 11 - frame * 2, 6, 5, 'R');
      paintRect(grid, rearShoulder, 34, 5, 5, 'M');
      paintRect(grid, 8, 44, 7, 8, 'M');
      paintRect(grid, 17, 44, 7, 6, 'M');
      paintRect(grid, 6, 52, 8, 8, 'M');
      paintRect(grid, 18, 50, 8, 6, 'M');
      return;
    }

    if (type === 'longkick' || type === 'skyKick') {
      paintRect(grid, shoulder, 31, 6, 5, 'M');
      paintRect(grid, rearShoulder, 29, 6, 5, 'M');
      const kickDirection = type === 'longkick' ? -direction : direction;
      const footX = kickDirection > 0 ? 25 : 0;
      paintRect(grid, 12, 43, 8, 8, 'M');
      paintRect(grid, kickDirection > 0 ? 18 : 6, 44, 8, 5, 'M');
      paintRect(grid, kickDirection > 0 ? 23 : 1, 43 + frame, 8, 5, 'M');
      paintRect(grid, footX, 43 + frame, 8, 4, 'R');
      paintRect(grid, kickDirection > 0 ? 3 : 21, 50, 8, 8, 'M');
      paintRect(grid, kickDirection > 0 ? 0 : 20, 57, 9, 3, 'M');
      return;
    }

    if (type === 'spin') {
      paintRect(grid, 0, 29, 10, 5, 'M'); paintRect(grid, 22, 29, 10, 5, 'M');
      paintRect(grid, 0, 26, 5, 4, 'R'); paintRect(grid, 27, 26, 5, 4, 'R');
      paintRect(grid, 5, 44, 8, 7, 'M'); paintRect(grid, 19, 44, 8, 7, 'M');
      paintRect(grid, 1, 50, 9, 5, 'M'); paintRect(grid, 22, 50, 9, 5, 'M');
      return;
    }

    if (type === 'fadeaway') {
      paintRect(grid, rearShoulder, 27, 5, 8, 'M');
      paintRect(grid, direction > 0 ? 3 : 25, 23, 6, 5, 'M');
      paintRect(grid, shoulder, 33, 5, 5, 'M');
      paintRect(grid, 7, 44, 8, 7, 'M'); paintRect(grid, 17, 44, 8, 7, 'M');
      paintRect(grid, 4, 51, 8, 8, 'M'); paintRect(grid, 20, 51, 8, 8, 'M');
      return;
    }

    if (type === 'shot' || type === 'dunk' || type === 'charge' || type === 'chargedPunch' || type === 'energyBeam' || type === 'hotdog') {
      paintRect(grid, rearShoulder, 30, 5, 7, 'M');
      paintRect(grid, shoulder, 30, 6, 5, 'M');
      paintRect(grid, direction > 0 ? 25 : 1, type === 'dunk' ? 25 : 31, 6, 4, 'M');
      paintRect(grid, direction > 0 ? 29 : 0, type === 'dunk' ? 20 + frame : 31, 3, 4, 'R');
      if (type === 'charge' || type === 'chargedPunch' || type === 'dunk') {
        paintRect(grid, 7, 40, 9, 6, 'M'); paintRect(grid, 16, 43, 9, 6, 'M');
        paintRect(grid, 4, 46, 8, 7, 'M'); paintRect(grid, 19, 49, 9, 7, 'M');
      } else {
        paintRect(grid, 8, 44, 7, 8, 'M'); paintRect(grid, 17, 44, 7, 8, 'M');
        paintRect(grid, 6, 52, 8, 8, 'M'); paintRect(grid, 18, 52, 8, 8, 'M');
      }
      return;
    }

    paintArms(grid, 'hit', frame);
    paintLegs(grid, 'hit', frame);
  }

  function getPose(fighter, time) {
    let state = 'idle';
    if (fighter.stun > 0) state = 'hit';
    else if (fighter.grillInputHeld) state = 'attacking';
    else if (fighter.attack > 0) state = 'attacking';
    else if (!fighter.grounded) state = fighter.vy > 35 ? 'falling' : 'jumping';
    else if (Math.abs(fighter.vx) > 22) state = 'running';

    const frame = Math.floor(time / (state === 'hit' || state === 'attacking' ? 65 : 110)) % 2;
    const grid = expandSprite(fighter.sprite).map(row => row.split(''));
    if (state === 'attacking') paintAttack(grid, fighter.attackType, frame, fighter.facing || 1, fighter.attackCombo || 0);
    else if (state !== 'idle') {
      paintArms(grid, state, frame);
      paintLegs(grid, state, frame);
    }
    return {
      state,
      frame,
      sprite: grid.map(row => row.join('')),
      offsetX: state === 'hit' ? (frame === 0 ? -0.5 : 0.5) : 0,
      offsetY: state === 'running' ? (frame === 0 ? -0.5 : 0) : state === 'jumping' ? -0.5 : state === 'attacking' && ['charge', 'chargedPunch', 'dunk'].includes(fighter.attackType) ? -.5 : 0,
      flash: state === 'hit' && frame === 0,
    };
  }

  function drawBasketball(context, ball, time) {
    const x = Math.round(ball.x), y = Math.round(ball.y);
    const seam = Math.floor(time / 90) % 2;
    context.fillStyle = '#532e2b'; context.fillRect(x - 5, y - 5, 10, 10);
    context.fillStyle = '#d46b2e'; context.fillRect(x - 4, y - 4, 8, 8);
    context.fillStyle = '#f59a38'; context.fillRect(x - 2, y - 3, 4, 6);
    context.fillStyle = '#532e2b'; context.fillRect(x - 1, y - 4, 2, 8);
    context.fillRect(x - 4 + seam * 2, y - 1, 8, 2);
    context.fillStyle = '#ffd27a'; context.fillRect(x - 2, y - 3, 2, 2);
  }

  window.SmashAnimations = { getPose, drawBasketball };
})();