let objs = [];
let colors = ['#DE183C', '#F2B541', '#00aeff', '#19446B', '#019b83', '#0000e6', '#ffdd00'];
// 新增：動畫狀態
let tkAnim = {
    phase: 'idle',      // 'up' | 'pause' | 'down'
    start: 0,
    upDur: 700,         // 上升時間（ms）
    downDur: 700,       // 下降時間（ms）
    pauseDur: 3000,     // 停滯時間（ms）
    amplitude: 48,      // 跳動幅度（像素） 
    currentOffset: 0
};

// 可調參數：滑鼠排斥效果
// 當滑鼠靠近粒子，若距離小於 REPEL_RADIUS，粒子會被推開，力量以 REPEL_STRENGTH 決定
let REPEL_RADIUS = 80;    // 影響範圍（像素，已考慮畫面縮放）
let REPEL_STRENGTH = 12;  // 推開的最大位移速度（每幀的最大位移）

let menu = {
    lineX: 8,
    lineY: 8,
    lineW: 8,         // 加寬白色直線，方便觸碰
    lineH: 100,       // 直線高度增加
    pad: 12,          // 內距增加
    width: 240,       // 選單寬度放大
    itemHeight: 42,   // 選單項目高度放大
    items: ['戳泡泡', '戳跑泡筆記', '測驗作品', '障礙賽遊戲', '此頁面筆記', '淡江大學', '關於我'],
    visible: false,
    subItems: ['教育科技學系'], // 預設隱藏的子選單
    subVisible: false
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    let cx = width / 2;
    let cy = height / 2;
    let num = 35;
    // 使用畫面較小邊長，確保格子為正方形並能置中
    let w = min(width, height) / num;
    let gridW = w * num;
    let startX = cx - gridW / 2 + w / 2;
    let startY = cy - gridW / 2 + w / 2;

    for (let i = 0; i < num; i++) {
        for (let j = 0; j < num; j++) {
            let x = startX + i * w;
            let y = startY + j * w;
            let dst = dist(x, y, cx, cy);
            let maxDst = sqrt(sq(gridW / 2) + sq(gridW / 2));
            let t = int(map(dst, 0, maxDst, -50, 0));
            for (let k = 0; k < 3; k++) {
                objs.push(new MJRC(x, y, w, t));
            }
        }
    }
    objs.sort((a, b) => {
        let c = dist(a.x, a.y, cx, cy);
        let d = dist(b.x, b.y, cx, cy);
        return c - d;
    });
}

function draw() {
    push();
    translate(width / 2, height / 2);
    scale(0.7);
    translate(-width / 2, -height / 2);
    background(0);
    for (let i of objs) {
        i.show();
        i.move();
    }
    pop();

    // Draw overlay UI (line + menu) on top
    drawMenu();

    // 中央文字（最上層）
    drawCenterText();

    // 新增：淡江大學 動畫文字與固定背景方框（最頂層）
    drawTamkangLabel();
}

// 新增：在畫面中央顯示兩行文字（教科系 / 414730530  陳宥縈）
function drawCenterText() {
    let sz = 40;                     // 字大小 80px
    push();
    textFont('Chiron GoRound TC');   // 使用雲端字型
    textAlign(CENTER, CENTER);
    textSize(sz);
    textLeading(sz * 1.05);          // 行距
    stroke(0);
    strokeWeight(max(2, sz * 0.06)); // 黑色描邊
    fill(255);                       // 白色字
    text('教科系\n414730530  陳宥縈', width / 2, height / 10);
    pop();
}

// 新增 easing 函數：easeOutBounce 與 easeInOutQuad
function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
    } else if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
    } else {
        x -= 2.625 / d1;
        return n1 * x * x + 0.984375;
    }
}
function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// 新增：繪製淡江大學文字與固定背景方框（文字上下跳動）
function drawTamkangLabel() {
    // 使用像素時間（ms）
    let now = millis(); 

    // 更新動畫階段機制
    if (tkAnim.phase === 'idle') {
        // 立即開始上跳
        tkAnim.phase = 'up';
        tkAnim.start = now;
    } else if (tkAnim.phase === 'up') {
        let t = constrain((now - tkAnim.start) / tkAnim.upDur, 0, 1);
        // 先用 easeInOutQuad 做主要進度，並將結果套入 easeOutBounce 以獲得彈跳效果
        let p = easeInOutQuad(t);
        let bounce = easeOutBounce(p);
        tkAnim.currentOffset = -tkAnim.amplitude * bounce;
        if (t >= 1) {
            tkAnim.phase = 'pause';
            tkAnim.start = now;
        }
    } else if (tkAnim.phase === 'pause') {
        tkAnim.currentOffset = -tkAnim.amplitude; // 固定在上方（放心：box 足夠大）
        if (now - tkAnim.start >= tkAnim.pauseDur) {
            tkAnim.phase = 'down';
            tkAnim.start = now;
        }
    } else if (tkAnim.phase === 'down') {
        let t = constrain((now - tkAnim.start) / tkAnim.downDur, 0, 1);
        // 下降使用 easeInOutQuad（從上方回到 0）
        let p = easeInOutQuad(t);
        tkAnim.currentOffset = -tkAnim.amplitude * (1 - p);
        if (t >= 1) {
            tkAnim.phase = 'idle';
            tkAnim.start = now;
            tkAnim.currentOffset = 0;
        }
    }

    // 繪製：背景方框（固定，不跟文字位移）
    push();
    textFont('Chiron GoRound TC');
    textSize(72);
    textAlign(CENTER, CENTER);
    // 量測文字大小
    let txt = '淡江大學';
    let tw = textWidth(txt);
    // 文字高度近似
    let th = textAscent() + textDescent();

    // 方框尺寸，加大以容納跳動
    let padX = 48;
    let padY = 48 + tkAnim.amplitude; // 增加垂直 padding，確保文字跳動不超出方框
    let boxW = tw + padX * 2;
    let boxH = th + padY * 2;

    // 方框位置（畫面中心）
    let bx = width / 2;
    let by = height / 2;

    // 背景方框（白色 50% 透明）
    noStroke();
    fill(255, 128);
    rectMode(CENTER);
    rect(bx, by, boxW, boxH, 12);
    pop();

    // 繪製文字（有上下位移）
    push();
    textFont('Chiron GoRound TC');
    textSize(72);
    textAlign(CENTER, CENTER);
    // 白色文字（頂層）
    fill(255);
    // 使用 currentOffset 作垂直位移（只有文字移動）
    text(txt, width / 2, height / 2 + tkAnim.currentOffset);
    pop();
}


function easeInOutCirc(x) {
    return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

class MJRC {
    constructor(x, y, w, t) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = w;
        this.cr = 0;

        this.x0 = x;
        this.y0 = y;
        this.w0 = w;
        this.h0 = w;
        this.cr0 = 0;

        this.x1 = this.x + this.w * random(-1, 1) * 5;
        this.y1 = this.y + this.w * random(-1, 1) * 5;
        this.w1 = this.w * random(0.25, 0.75);
        this.h1 = this.w1;
        this.cr1 = max(this.w1, this.h1);
        this.a0 = 0;
        this.a1 = random(-1, 1) * TAU;
        this.a = 0;

        this.alph0 = 0;
        this.alph1 = 255;
        this.alph = 0;

        this.t = t;
        this.t1 = 60;
        this.t2 = this.t1 + 60;
        this.t3 = this.t2 + 80;

        this.col1 = color('#000000ff');
        this.init();
    }

    show() {
        push();
        translate(this.x, this.y);
        rotate(this.a);
        fill(this.col);
        noStroke();
        rect(0, 0, this.w, this.h, this.cr);
        pop();
    }

    move() {
        if (0 < this.t && this.t < this.t1) {
            let n = norm(this.t, 0, this.t1 - 1) ** 0.25;
            this.x = lerp(this.x0, this.x1, n);
            this.y = lerp(this.y0, this.y1, n);
            this.w = lerp(this.w0, this.w1, n);
            this.h = lerp(this.h0, this.h1, n);
            this.cr = lerp(this.cr0, this.cr1, n);
            this.a = lerp(this.a0, this.a1, n);
            this.col = lerpColor(this.col1, this.col2, n ** 0.5);
        }

        if (this.t1 < this.t && this.t < this.t2) {
            let n = norm(this.t, this.t1, this.t2 - 1) ** 4;
            this.x = lerp(this.x1, this.x0, n);
            this.y = lerp(this.y1, this.y0, n);
            this.w = lerp(this.w1, this.w0, n);
            this.h = lerp(this.h1, this.h0, n);
            this.cr = lerp(this.cr1, this.cr0, n);
            this.a = lerp(this.a1, this.a0, n);
            this.col = lerpColor(this.col2, this.col1, n** 2);
        }
        if (this.t > this.t3) {
            this.init();
            this.t = 0;
        }
        // --- 滑鼠排斥（使粒子遠離滑鼠） ---
        // 注意：畫面在 draw() 中有縮放(scale(0.7))，因此需要把畫面座標的 mouseX/mouseY 反轉回未縮放的座標
        // 變換關係為：x_screen = (x - width/2) * 0.7 + width/2
        // 反推：x = (x_screen - width/2) / 0.7 + width/2
        let mx = (mouseX - width / 2) / 0.7 + width / 2;
        let my = (mouseY - height / 2) / 0.7 + height / 2;
        let dx = this.x - mx;
        let dy = this.y - my;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL_RADIUS && d > 0.00001) {
            // 力量依距離線性衰減（越近被推得越強）
            let f = (1 - d / REPEL_RADIUS) * REPEL_STRENGTH;
            this.x += (dx / d) * f;
            this.y += (dy / d) * f;
        }

        this.t++;
    }

    init(){
        this.x1 = this.x + this.w * random(-1, 1) * 5;
        this.y1 = this.y + this.w * random(-1, 1) * 5;
        this.w1 = this.w * random(0.25, 0.75);
        this.h1 = this.w1;
        this.cr1 = max(this.w1, this.h1);
        this.a0 = 0;
        this.a1 = random(-1, 1) * TAU;
        this.col2 = color(random(colors));
        this.col = this.col1;
    }

}

function drawMenu() {
    // 計算直線與主選單範圍
    let lineRect = {
        x: menu.lineX,
        y: menu.lineY,
        w: menu.lineW,
        h: menu.lineH
    };
    let menuX = menu.lineX + menu.lineW + 8;
    let menuY = menu.lineY;
    let menuH = menu.items.length * menu.itemHeight + menu.pad;

    // 判斷是否滑鼠在白色直線或主選單範圍
    let overLine = mouseX >= lineRect.x && mouseX <= lineRect.x + lineRect.w && mouseY >= lineRect.y && mouseY <= lineRect.y + lineRect.h;
    let overMenu = mouseX >= menuX && mouseX <= menuX + menu.width && mouseY >= menuY && mouseY <= menuY + menuH;

    // 判斷是否在「淡江大學」項目上，以顯示子選單
    let targetIdx = menu.items.indexOf('淡江大學');
    let overTarget = false;
    let subX = 0, subY = 0, subW = 200, subH = 0;
    if (targetIdx >= 0) {
        let iy = menuY + menu.pad / 2 + targetIdx * menu.itemHeight;
        let itemRect = { x: menuX, y: iy, w: menu.width, h: menu.itemHeight };
        overTarget = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w && mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;
        // 子選單位置（顯示在主選單右方）
        subX = menuX + menu.width + 8;
        subY = iy;
        subH = menu.subItems.length * menu.itemHeight + menu.pad;
    }

    // 判斷是否在子選單上
    let overSub = menu.subItems.length > 0 && mouseX >= subX && mouseX <= subX + subW && mouseY >= subY && mouseY <= subY + subH;

    // 子選單顯示條件：滑鼠在該項或在子選單上
    menu.subVisible = overTarget || overSub;

    // 主選單顯示條件：滑鼠在白線、主選單或子選單上
    menu.visible = overLine || overMenu || menu.subVisible;

    noStroke();
    // 白色直線（固定顯示）
    push();
    rectMode(CORNER);
    fill(255);
    rect(lineRect.x, lineRect.y, lineRect.w, lineRect.h, 4);
    pop();

    // 若未顯示選單就結束
    if (!menu.visible) {
        cursor(ARROW);
        return;
    }

    // 選單背景（白色 50% 透明）
    push();
    rectMode(CORNER);
    fill(255, 128);
    stroke(200, 180);
    strokeWeight(0.5);
    rect(menuX, menuY, menu.width, menuH, 8);
    pop();

    // 主選單文字
    push();
    textAlign(LEFT, CENTER);
    textSize(20);
    noStroke();
    for (let i = 0; i < menu.items.length; i++) {
        let iy = menuY + menu.pad / 2 + i * menu.itemHeight;
        let itemRect = {
            x: menuX,
            y: iy,
            w: menu.width,
            h: menu.itemHeight
        };
        let overItem = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w && mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;
        fill(overItem ? '#00aeff' : 255);
        text(menu.items[i], itemRect.x + 14, itemRect.y + itemRect.h / 2);
        if (overItem) cursor(HAND);
    }
    pop();

    // 子選單：只有當 menu.subVisible 為 true 時顯示
    if (menu.subVisible) {
        push();
        rectMode(CORNER);
        fill(255, 230);
        stroke(200, 180);
        strokeWeight(0.5);
        rect(subX, subY, subW, subH, 8);
        pop();

        push();
        textAlign(LEFT, CENTER);
        textSize(18);
        noStroke();
        for (let i = 0; i < menu.subItems.length; i++) {
            let iy = subY + menu.pad / 2 + i * menu.itemHeight;
            let itemRect = { x: subX, y: iy, w: subW, h: menu.itemHeight };
            let overItem = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w && mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;
            fill(overItem ? '#00aeff' : 50);
            text(menu.subItems[i], itemRect.x + 14, itemRect.y + itemRect.h / 2);
            if (overItem) cursor(HAND);
        }
        pop();
    }
}

// --- 新增：iframe 顯示與選單點擊處理（含無法嵌入的 fallback） ---
let iframeOverlay = null;
let iframeEl = null;
const menuUrls = {
    '戳泡泡': 'https://cyou7734uz-hue.github.io/20251014_2/',
    // 若 HackMD 或其他網站設定 X-Frame-Options: sameorigin，將無法嵌入，程式會自動在新分頁開啟
    '戳跑泡筆記': 'https://hackmd.io/@uM9ZdlN3RnGOuhjBWPMTbw/rylSlFu12xg',
    '測驗作品': 'https://cyou7734uz-hue.github.io/20251028/',
    '障礙賽遊戲': 'https://cyou7734uz-hue.github.io/cat/',
    '此頁面筆記': 'https://hackmd.io/@uM9ZdlN3RnGOuhjBWPMTbw/Hy-7jOuJ3xx',
    '淡江大學': 'https://www.tku.edu.tw/',
    '關於我': 'https://cyou7734uz-hue.github.io/2025ME/' // 請將 '#' 替換成作品六的正確網址
};
const submenuUrls = {
    '教育科技學系': 'https://www.et.tku.edu.tw/' // 可替換為系所頁面
};

function mousePressed() {
    // 若選單未顯示，忽略
    if (!menu.visible) return;

    // 計算選單項目位置（與 drawMenu 同步的計算）
    let menuX = menu.lineX + menu.lineW + 8;
    let menuY = menu.lineY;
    for (let i = 0; i < menu.items.length; i++) {
        let iy = menuY + menu.pad / 2 + i * menu.itemHeight;
        let itemRect = {
            x: menuX,
            y: iy,
            w: menu.width,
            h: menu.itemHeight
        };
        let overItem = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w && mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;
        if (overItem) {
            let key = menu.items[i];
            let url = menuUrls[key];
            if (!url) break;
            if (key === '戳泡泡') {
                // 強制使用 iframe 顯示「戳泡泡」
                openIframe(url);
            } else if (key === '淡江大學') {
                // 直接在新分頁開啟淡江大學
                window.open(url, '_blank');
                showToast('在新分頁開啟：' + key);
            } else {
                // 其他作品直接在新分頁開啟（避免嵌入被阻擋）
                window.open(url, '_blank');
                showToast('在新分頁開啟：' + key);
            }
            return;
        }
    }

    // 處理子選單點擊（若顯示）
    if (menu.subVisible) {
        let targetIdx = menu.items.indexOf('淡江大學');
        if (targetIdx >= 0) {
            let subX = menuX + menu.width + 8;
            let subY = menuY + menu.pad / 2 + targetIdx * menu.itemHeight;
            let subW = 200;
            for (let i = 0; i < menu.subItems.length; i++) {
                let iy = subY + menu.pad / 2 + i * menu.itemHeight;
                let itemRect = { x: subX, y: iy, w: subW, h: menu.itemHeight };
                let overSubItem = mouseX >= itemRect.x && mouseX <= itemRect.x + itemRect.w && mouseY >= itemRect.y && mouseY <= itemRect.y + itemRect.h;
                if (overSubItem) {
                    let key = menu.subItems[i];
                    let url = submenuUrls[key] || menuUrls['淡江大學'];
                    window.open(url, '_blank');
                    showToast('在新分頁開啟：' + key);
                    return;
                }
            }
        }
    }
}

function openIframe(url) {
    closeIframe(); // 若已有則先關閉

    // 建立遮罩容器（cover）
    iframeOverlay = document.createElement('div');
    Object.assign(iframeOverlay.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        boxSizing: 'border-box'
    });
    // 點擊遮罩任一處關閉（但點擊 iframe 本身不會關閉）
    iframeOverlay.addEventListener('click', closeIframe);

    // 建立 iframe
    iframeEl = document.createElement('iframe');
    iframeEl.src = url;
    iframeEl.setAttribute('frameborder', '0');
    iframeEl.setAttribute('allowfullscreen', '');
    Object.assign(iframeEl.style, {
        width: Math.floor(window.innerWidth * 0.8) + 'px', // 寬為全螢幕的 80%
        height: Math.floor(window.innerHeight * 0.8) + 'px',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        background: '#fff'
    });
    // 防止點擊 iframe 時觸發 overlay 點擊事件
    iframeEl.addEventListener('click', function (e) { e.stopPropagation(); });

    // 處理 iframe load / error：若網站以 X-Frame-Options 或 CSP 阻擋嵌入，會在 onload 後無法存取 contentDocument -> 視為被阻擋
    let loadHandled = false;
    iframeEl.addEventListener('load', function () {
        if (loadHandled) return;
        loadHandled = true;
        // 嘗試讀取 iframe 文件，若被同源策略或 X-Frame-Options 阻擋會拋錯
        try {
            // 嘗試存取 document（若成功表示可嵌入）
            let doc = iframeEl.contentDocument || iframeEl.contentWindow.document;
            if (!doc) throw new Error('no doc');
            // 若可以存取但內容仍可能為錯誤頁面（404/403），無法可靠讀取狀態碼，故不作額外檢查
            // 正常嵌入：什麼都不做
        } catch (e) {
            // 無法嵌入，關閉 iframe 並在新分頁開啟
            closeIframe();
            window.open(url, '_blank');
            showToast('該網站不允許嵌入，已在新分頁開啟。');
        }
    }, { passive: true });

    iframeEl.addEventListener('error', function () {
        if (loadHandled) return;
        loadHandled = true;
        closeIframe();
        window.open(url, '_blank');
        showToast('載入失敗，已在新分頁開啟。');
    });

    // 關閉按鈕
    let closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        right: '28px',
        top: '28px',
        width: '42px',
        height: '42px',
        borderRadius: '22px',
        border: 'none',
        background: 'rgba(255,255,255,0.9)',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: 10000
    });
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeIframe(); });

    // 包一個容器以便放置按鈕（避免按鈕受 overlay 點擊關閉）
    let frameWrap = document.createElement('div');
    Object.assign(frameWrap.style, {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    frameWrap.appendChild(iframeEl);
    frameWrap.appendChild(closeBtn);
    iframeOverlay.appendChild(frameWrap);
    document.body.appendChild(iframeOverlay);

    // 在視窗大小改變時調整 iframe 大小
    window.addEventListener('resize', adjustIframeSize);
}

function adjustIframeSize() {
    if (!iframeEl) return;
    iframeEl.style.width = Math.floor(window.innerWidth * 0.8) + 'px';
    iframeEl.style.height = Math.floor(window.innerHeight * 0.8) + 'px';
}

function closeIframe() {
    if (iframeOverlay) {
        iframeOverlay.remove();
        iframeOverlay = null;
        iframeEl = null;
        window.removeEventListener('resize', adjustIframeSize);
    }
}

// 簡單 toast 提示（自動消失）
function showToast(msg, duration = 3000) {
    const id = 'embed-toast';
    // 若已有先移除
    const prev = document.getElementById(id);
    if (prev) prev.remove();

    let t = document.createElement('div');
    t.id = id;
    t.innerText = msg;
    Object.assign(t.style, {
        position: 'fixed',
        left: '50%',
        bottom: '6vh',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '6px',
        zIndex: 10001,
        fontSize: '14px',
        maxWidth: '80vw',
        textAlign: 'center'
    });
    document.body.appendChild(t);
    setTimeout(() => {
        t.remove();
    }, duration);
}