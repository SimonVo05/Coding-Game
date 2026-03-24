let canvas, ctx;
let backgroundImage = null;

// --- CAT STATE (unchanged numerics) ---
let cat = {
    x: 50,
    y: 400,
    width: 200,
    height: 200,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 20,
    isOnGround: false,
    gravity: 0.3,
    facingRight: true
};

let keys = { left: false, right: false, space: false };

// --- SPRITES & ANIMATION ---
const sprites = {
    run:  { img: new Image(), frameW: 0, frameH: 0, frames: 1, fps: 12, loaded: false },
    idle: { img: new Image(), frameW: 0, frameH: 0, frames: 1, fps: 6,  loaded: false }
};
// Place computer at right fifth of the canvas, same ground height as cat
const computer = {
    get x() { return canvas ? canvas.width * 0.6 : 800; }, // right fifth
    get y() { return 450 - this.height; }, // same ground as cat
    width: 80,
    height: 60
};


const anim = { current: 'idle', frame: 0, acc: 0 }; // acc = time accumulator (seconds)
let lastTime = 0;

// =======================
//  Public API
// =======================
export function init(canvasElement) {
    if (!__IS_MOVE_PAGE__) return; // no-op outside /move
    canvas = canvasElement;
    ctx = canvas.getContext('2d', { alpha: true });

    // --- High-DPI fix: set pixel-perfect scaling ---
    const scale = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * scale;
    canvas.height = window.innerHeight * scale;
    ctx.scale(scale, scale);

    // --- Make sure smoothing is disabled for crisp sprites ---
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "low";
    // Fill the viewport like your original code
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Background
    backgroundImage = new Image();
    backgroundImage.onload = () => console.log('Background image loaded.');
    backgroundImage.onerror = () => console.log('Failed to load background image');
    backgroundImage.src = './images/9k.png';

    // --- Load sprites ---
    sprites.run.img.onload = function () {
        sprites.run.frameH = this.height;
        sprites.run.frameW = this.height; // assume square frames laid out horizontally
        sprites.run.frames = Math.max(1, Math.floor(this.width / sprites.run.frameW));
        sprites.run.loaded = true;
        console.log(`Run sprite loaded (${sprites.run.frames} frames).`);
    };
    sprites.idle.img.onload = function () {
        sprites.idle.frameH = this.height;
        sprites.idle.frameW = this.height; // square frames
        sprites.idle.frames = Math.max(1, Math.floor(this.width / sprites.idle.frameW));
        sprites.idle.loaded = true;
        console.log(`Idle sprite loaded (${sprites.idle.frames} frames).`);
    };

    // IMPORTANT: make sure these paths match where you placed the PNGs
    sprites.run.img.src  = '../images/OrangeTabby-Run.png';
    sprites.idle.img.src = '../images/OrangeTabby-Idle.png';

    // Input
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Start loop
    requestAnimationFrame(gameLoop);
}

// Early check — true only when the browser path is exactly /move (no trailing slashes)
const __IS_MOVE_PAGE__ = (typeof window !== 'undefined') && (function() {
    try { return window.location.pathname.replace(/\/+$/, '') === '/move'; } catch (e) { return false; }
})();

// Replace your existing exported functions with these (keep the rest of the file unchanged)
// export function init(canvasElement) {
//     if (!__IS_MOVE_PAGE__) return; // no-op outside /move
//     // --- original init body starts here ---
//     // (copy the body of your previous `export function init(canvasElement) { ... }` here)
//     // --- original init body ends here ---
// }

export function dispose() {
    if (!__IS_MOVE_PAGE__) return; // no-op outside /move
    // --- original dispose body starts here ---
    // (copy the body of your previous `export function dispose() { ... }` here)
    // --- original dispose body ends here ---
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

// =======================
//  Internal helpers
// =======================
function handleKeyDown(event) {
    const controlsInfo = document.querySelector('.controls-info');
    if (controlsInfo && !controlsInfo.classList.contains('fade-out')) {
        controlsInfo.classList.add('fade-out');
    }

    switch (event.code) {
        case 'ArrowLeft':
        //case 'KeyA':
            keys.left = true;
            cat.facingRight = false;
            event.preventDefault();
            break;
        case 'ArrowRight':
        //case 'KeyD':
            keys.right = true;
            cat.facingRight = true;
            event.preventDefault();
            break;
        case 'Space':
            keys.space = true;
            event.preventDefault();
            break;
    }
}

function handleKeyUp(event) {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'Space':
            keys.space = false;
            break;
    }
}

function gameLoop(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.033, (now - lastTime) / 1000); // clamp to ~30fps step max
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// -----------------------
//  Physics & animation
// -----------------------
function update(dt) {
    // Horizontal
    if (keys.left) {
        cat.velocityX = -cat.speed;
    } else if (keys.right) {
        cat.velocityX = cat.speed;
    } else {
        cat.velocityX *= 0.8; // friction
    }

    // Jump
    if (keys.space && cat.isOnGround) {
        cat.velocityY = -cat.jumpPower;
        cat.isOnGround = false;
    }

    // Gravity
    cat.velocityY += cat.gravity;

    // Integrate
    cat.x += cat.velocityX;
    cat.y += cat.velocityY;

    // keep cat inside left/right bounds
    if (cat.x < 0) {
        cat.x = 0;
        cat.velocityX = 0;
    }
    if (cat.x + cat.width > canvas.width) {
        cat.x = canvas.width - cat.width;
        cat.velocityX = 0;
    }

    // optional ceiling collision so it can't go above the top
    if (cat.y < 0) {
        cat.y = 0;
        if (cat.velocityY < 0) {
            cat.velocityY = 0;
        }
    }

    // Simple ground @ y = 450
    if (cat.y + cat.height >= 600) {
        cat.y = 600 - cat.height;
        cat.velocityY = 0;
        cat.isOnGround = true;
    }

    // Wrap horizontally
    // if (cat.x < 0) cat.x = canvas.width - cat.width;
    // if (cat.x + cat.width > canvas.width) cat.x = 0;

    // ---- Pick animation & advance frames ----
    const moving = keys.left || keys.right;
    const airborne = !cat.isOnGround || keys.space;
    const desired = (moving || airborne) ? 'run' : 'idle';

    if (anim.current !== desired) {
        anim.current = desired;
        anim.frame = 0;
        anim.acc = 0;
    }

    const cur = sprites[anim.current];
    if (cur.loaded && cur.frames > 1) {
        anim.acc += dt;
        const step = 1 / cur.fps;
        while (anim.acc >= step) {
            anim.acc -= step;
            anim.frame = (anim.frame + 1) % cur.frames;
        }
    }
    // Check if cat is close enough to computer
    const link = document.getElementById('startLink');
    if (link) {
        const distance = Math.abs(cat.x - computer.x);
        if (distance < 100) {
            // Show link if close
            link.style.display = 'block';
            link.style.opacity = 1;
        } else {
            // Hide link if far
            link.style.opacity = 0;
            setTimeout(() => {
                if (link.style.opacity == 0) link.style.display = 'none';
            }, 500);
        }
    }

}

// -----------------------
//  Rendering
// -----------------------
function render() {
    // Clear / background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage && backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 17) % canvas.width;
            const y = (i * 23) % canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // Glow
    // ctx.shadowColor = cat.color;
    // ctx.shadowBlur = 15;

    // Draw cat via sprites
    drawCatSprite(cat.x, cat.y, cat.width, cat.height, cat.facingRight);
}

// --- Rewritten drawCat -> sprite rendering ---
function drawCatSprite(dx, dy, dw, dh, facingRight) {
    const s = sprites[anim.current];
    if (!s.loaded) {
        // Fallback: small placeholder until sprite loads
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(dx, dy, dw, dh);
        return;
    }

    const sx = (anim.frame % s.frames) * s.frameW;
    const sy = 0;

    ctx.save();
    if (!facingRight) {
        // Flip around the sprite’s right edge
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(s.img, sx, sy, s.frameW, s.frameH, 0, 0, dw, dh);
    } else {
        ctx.drawImage(s.img, sx, sy, s.frameW, s.frameH, dx, dy, dw, dh);
    }
    ctx.restore();
}
