// 游戏状态
const gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    level: 1,
    enemiesKilled: 0,
    playerLevel: 1,
    experience: 0,
    experienceToNext: 100,
    coins: 0,
    showShop: false,
    shopItems: [],
    isInvincible: false,
    invincibleTimer: 0,
    shopTimer: 0,
    shopTimeLimit: 30, // 30秒倒计时
    shopTimeLimitBase: 30, // 基础时间限制，用于计算进度条
    lastTime: 0 // 用于计算帧间隔
};

// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 武器系统
const weapons = {
    ak47: {
        name: 'AK-47',
        damage: 35,
        spread: 0.3,
        fireRate: 150,
        auto: true,
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 120,
        color: '#8B4513'
    },
    m4a1: {
        name: 'M4A1',
        damage: 25,
        spread: 0.15,
        fireRate: 100,
        auto: true,
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 90,
        color: '#2F4F4F'
    },
    deagle: {
        name: '沙漠之鹰',
        damage: 45,
        spread: 0,
        fireRate: 300,
        auto: false,
        ammo: 7,
        maxAmmo: 7,
        reloadTime: 60,
        color: '#FFD700'
    },
    rocket: {
        name: '火箭弹',
        damage: 50,
        splashDamage: 15,
        splashRadius: 80,
        fireRate: 800,
        auto: false,
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 180,
        color: '#FF4500'
    },
    shotgun: {
        name: '霰弹枪',
        damage: 30,
        pelletCount: 3,
        spread: 0.4,
        fireRate: 400,
        auto: false,
        ammo: 8,
        maxAmmo: 8,
        reloadTime: 150,
        color: '#8B0000'
    }
};

// 游戏对象
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 5,
    health: 100,
    maxHealth: 100,
    currentWeapon: 'deagle',
    weapons: ['deagle'],
    weaponIndex: 0,
    reloadTime: 0,
    lastShot: 0,
    direction: { x: 0, y: 0 },
    chargeStart: 0,
    isCharging: false,
    // 属性系统
    baseSpeed: 5,
    baseDamage: 1,
    defense: 0,
    shield: 0,
    maxShield: 0,
    attackSpeed: 1,
    healEffect: 1,
    pickupRange: 50,
    lifeSteal: 0, // 吸血百分比，0~1
    // 特殊道具
    autoFire: false,
    autoPickup: false,
    autoReload: false,
    clone: null,
    thirdWeapon: null,
    // 分身
    cloneActive: false,
    cloneHealth: 0,
    // 近战武器挥舞状态
    meleeSwing: false,
    meleeSwingStart: 0,
    meleeSwingDuration: 300 // 300毫秒挥舞时间
};

// 敌人类型
const enemyTypes = {
    melee: {
        name: '近战小兵',
        health: 50,
        damage: 10,
        speed: 2,
        attackRange: 40,
        attackCooldown: 1000,
        lastAttack: 0,
        color: '#FF6B6B',
        behavior: 'melee'
    },
    ranged: {
        name: '远程小兵',
        health: 40,
        damage: 10,
        powerDamage: 20,
        speed: 1.5,
        attackRange: 300,
        attackCooldown: 800,
        powerShotInterval: 3,
        shotCount: 0,
        lastAttack: 0,
        color: '#4ECDC4',
        behavior: 'ranged'
    }
};

const bullets = [];
const enemies = [];
const particles = [];
const powerUps = [];
const coins = [];
const healthPacks = [];

// BOSS对象
let boss = null;

// 商店系统
const shopItems = {
    speed: { name: '移速提升', cost: 40, effect: 'speed', value: 0.5, description: '永久提升移动速度0.5' },
    damage: { name: '攻击力提升', cost: 60, effect: 'damage', value: 5, description: '永久提升攻击力5点' },
    defense: { name: '防御力提升', cost: 50, effect: 'defense', value: 5, description: '永久提升防御力5点' },
    shield: { name: '护盾提升', cost: 80, effect: 'shield', value: 20, description: '永久提升护盾20点' },
    attackSpeed: { name: '攻速提升', cost: 70, effect: 'attackSpeed', value: 0.1, description: '永久提升攻击速度10%' },
    health: { name: '生命值提升', cost: 45, effect: 'health', value: 20, description: '永久提升最大生命值20点' },
    healEffect: { name: '回复效果提升', cost: 35, effect: 'healEffect', value: 0.1, description: '永久提升回复效果10%' },
    pickupRange: { name: '拾取范围提升', cost: 25, effect: 'pickupRange', value: 10, description: '永久提升拾取范围10点' },
    autoFire: { name: '自动开火', cost: 150, effect: 'autoFire', value: true, description: '自动开火，无需手动点击' },
    autoPickup: { name: '自动拾取', cost: 120, effect: 'autoPickup', value: true, description: '自动拾取金币和回复道具' },
    autoReload: { name: '自动换弹', cost: 100, effect: 'autoReload', value: true, description: '弹药耗尽时自动换弹' },
    clone: { name: '分身术', cost: 250, effect: 'clone', value: true, description: '召唤一个属性为自身一半的分身' },
    invincible: { name: '开局无敌', cost: 200, effect: 'invincible', value: true, description: '开局3秒无敌时间' },
    thirdWeapon: { name: '第三武器槽', cost: 300, effect: 'thirdWeapon', value: true, description: '可以携带第三把武器' },
    reviveCoin: { name: '复活币', cost: 500, effect: 'reviveCoin', value: 1, description: '死亡时自动复活一次，最多使用3次' },
    ak47: { name: 'AK-47', cost: 150, effect: 'weapon', value: 'ak47', description: '高伤害，高偏移，全自动' },
    m4a1: { name: 'M4A1', cost: 130, effect: 'weapon', value: 'm4a1', description: '平衡型，快速射击，全自动' },
    rocket: { name: '火箭弹', cost: 180, effect: 'weapon', value: 'rocket', description: '范围伤害，溅射效果' },
    shotgun: { name: '霰弹枪', cost: 160, effect: 'weapon', value: 'shotgun', description: '多发子弹，扇形扩散' },
    lifeSteal: { name: '吸血项链', cost: 120, effect: 'lifeSteal', value: 0.05, description: '永久获得5%吸血（攻击敌人/BOSS时按伤害回血）' },
};

// 输入处理
const keys = {};
const mouse = { x: 0, y: 0, isPressed: false };

// 事件监听器
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // 换弹
    if (e.key === 'r' && player.reloadTime === 0) {
        player.reloadTime = weapons[player.currentWeapon].reloadTime;
    }
    
    // 切换武器
    if (e.key >= '1' && e.key <= '8') {
        const weaponIndex = parseInt(e.key) - 1;
        if (weaponIndex < player.weapons.length) {
            player.weaponIndex = weaponIndex;
            player.currentWeapon = player.weapons[weaponIndex];
        }
    }
    
    // 鼠标滚轮切换武器
    if (e.key === 'q') {
        player.weaponIndex = (player.weaponIndex - 1 + player.weapons.length) % player.weapons.length;
        player.currentWeapon = player.weapons[player.weaponIndex];
    }
    if (e.key === 'e') {
        player.weaponIndex = (player.weaponIndex + 1) % player.weapons.length;
        player.currentWeapon = player.weapons[player.weaponIndex];
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState.isRunning && !gameState.isPaused) {
        if (e.button === 0) { // 左键
            mouse.isPressed = true;
            const weapon = weapons[player.currentWeapon];
            if (weapon.name === '弓箭') {
                // 弓箭开始蓄力
                player.isCharging = true;
                player.chargeStart = Date.now();
            } else if (!weapon.auto) {
                // 半自动武器：点击一次射击一次
                shoot();
            }
            // 全自动武器：在updatePlayer中处理持续射击
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouse.isPressed = false;
        const weapon = weapons[player.currentWeapon];
        if (player.isCharging && weapon.name === '弓箭') {
            // 弓箭松开时释放
            shoot();
            player.isCharging = false;
        }
    }
});

// 开始游戏按钮
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('closeShopBtn').addEventListener('click', closeShop);
document.getElementById('refreshShopBtn').addEventListener('click', refreshShop);
document.getElementById('extendTimeBtn').addEventListener('click', extendShopTime);

// 游戏函数
function startGame() {
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.level = 1;
    gameState.enemiesKilled = 0;
    gameState.playerLevel = 1;
    gameState.experience = 0;
    gameState.experienceToNext = 100;
    gameState.coins = 50; // 开局给予50金币
    gameState.showShop = false;
    gameState.shopTimer = 0;
    gameState.lastTime = performance.now();
    gameState.combo = 0; // 连击数
    gameState.lastKillTime = 0; // 上次击杀时间
    gameState.isBossLevel = false; // 是否为BOSS关卡
    gameState.bossAttempts = 3; // BOSS挑战次数
    gameState.bossDefeated = false; // BOSS是否被击败
    gameState.cheatMode = false; // 作弊模式状态
    
    // 重置玩家颜色
    player.color = '#4ECDC4';
    
    // 重置玩家属性
    player.health = player.maxHealth;
    player.currentWeapon = 'deagle';
    player.weapons = ['deagle'];
    player.weaponIndex = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    // 重置属性
    player.baseSpeed = 5;
    player.baseDamage = 1;
    player.defense = 0;
    player.shield = 0;
    player.maxShield = 0;
    player.attackSpeed = 1;
    player.healEffect = 1;
    player.pickupRange = 50;
    
    // 重置特殊道具
    player.autoFire = false;
    player.autoPickup = false;
    player.autoReload = false;
    player.clone = null;
    player.thirdWeapon = null;
    player.cloneActive = false;
    player.cloneHealth = 0;
    player.meleeSwing = false;
    player.reviveCoins = 0; // 复活币数量
    player.maxReviveCoins = 3; // 最大复活币数量
    
    // 开局无敌
    if (player.invincible) {
        gameState.isInvincible = true;
        gameState.invincibleTimer = 180; // 3秒 * 60FPS
    }
    
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerUps.length = 0;
    coins.length = 0;
    healthPacks.length = 0;
    
    // 清除BOSS
    boss = null;
    
    // 重置所有武器弹药
    Object.keys(weapons).forEach(weaponKey => {
        const weapon = weapons[weaponKey];
        weapon.ammo = weapon.maxAmmo;
    });
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('shopScreen').classList.add('hidden');
    
    // 初始化武器显示
    updateWeaponDisplay();
    
    // 初始化复活币显示
    const reviveElement = document.getElementById('reviveValue');
    if (reviveElement) {
        reviveElement.textContent = `${player.reviveCoins}/${player.maxReviveCoins}`;
    }
    
    spawnEnemies();
    gameLoop();
}

function restartGame() {
    startGame();
}

function gameLoop() {
    if (!gameState.isRunning) return;
    
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // 计算帧间隔时间
    const currentTime = performance.now();
    const deltaTime = (currentTime - gameState.lastTime) / 1000; // 转换为秒
    gameState.lastTime = currentTime;
    
    // 商店倒计时（即使在暂停状态下也要运行）
    if (gameState.showShop) {
        gameState.shopTimer -= deltaTime;
        updateShopTimer();
        
        // 时间警告提示
        if (gameState.shopTimer <= 10 && gameState.shopTimer > 9.9) {
            showTimeWarning();
        }
        
        if (gameState.shopTimer <= 0) {
            // 时间到，自动关闭商店
            autoCloseShop();
        }
    }
    
    if (gameState.isPaused) return;
    
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBoss();
    updateParticles();
    updatePowerUps();
    updateCoins();
    updateHealthPacks();
    checkCollisions();
    updateUI();
    
    // 检查关卡进度
    if (enemies.length === 0 && !gameState.isBossLevel) {
        gameState.level++;
        
        // 检查是否为第5关（BOSS关）
        if (gameState.level === 5) {
            startBossBattle();
            return;
        }
        
        // 关卡奖励金币
        const levelReward = 30 + gameState.level * 5; // 基础30金币 + 每关5金币
        gameState.coins += levelReward;
        
        // 显示关卡奖励提示
        showLevelReward(levelReward);
        
        openShop();
    }
    
    // 检查BOSS是否被击败
    if (gameState.isBossLevel && boss && boss.health <= 0) {
        defeatBoss();
    }
}

function updatePlayer() {
    // 移动
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= player.baseSpeed;
    if (keys['s'] || keys['arrowdown']) dy += player.baseSpeed;
    if (keys['a'] || keys['arrowleft']) dx -= player.baseSpeed;
    if (keys['d'] || keys['arrowright']) dx += player.baseSpeed;
    
    // 对角线移动速度归一化
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    player.x += dx;
    player.y += dy;
    
    // 边界检查
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // 朝向鼠标
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    player.direction.x = Math.cos(angle);
    player.direction.y = Math.sin(angle);
    
    // 换弹
    if (player.reloadTime > 0) {
        player.reloadTime--;
        if (player.reloadTime === 0) {
            const weapon = weapons[player.currentWeapon];
            weapon.ammo = weapon.maxAmmo;
        }
    }
    
    // 自动射击
    const weapon = weapons[player.currentWeapon];
    if (weapon.ammo > 0 && player.reloadTime === 0) {
        const now = Date.now();
        if (now - player.lastShot > (weapon.fireRate / player.attackSpeed)) {
            // 全自动武器：鼠标按下或自动开火时射击
            if (weapon.auto && (mouse.isPressed || player.autoFire)) {
                shoot();
            }
            // 半自动武器：只有自动开火时才能自动射击（排除弓箭）
            else if (!weapon.auto && player.autoFire && weapon.name !== '弓箭') {
                shoot();
            }
        }
    }
    
    // 自动换弹
    if (player.autoReload && weapon.ammo === 0 && player.reloadTime === 0) {
        player.reloadTime = weapon.reloadTime;
    }
    
    // 无敌时间
    if (gameState.isInvincible) {
        gameState.invincibleTimer--;
        if (gameState.invincibleTimer <= 0) {
            gameState.isInvincible = false;
        }
    }
    
    // 分身移动
    if (player.cloneActive && player.clone) {
        const clone = player.clone;
        const dx = player.x - clone.x;
        const dy = player.y - clone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            clone.x += (dx / distance) * clone.speed;
            clone.y += (dy / distance) * clone.speed;
        }
    }
    
    // 近战武器挥舞动画更新
    if (player.meleeSwing) {
        const swingTime = Date.now() - player.meleeSwingStart;
        if (swingTime >= player.meleeSwingDuration) {
            player.meleeSwing = false;
        }
    }
}

function shoot() {
    const weapon = weapons[player.currentWeapon];
    // 检查弹药：只有非无限弹药的武器才检查弹药（作弊模式下无需换弹）
    if ((weapon.ammo !== Infinity && weapon.ammo <= 0) || (player.reloadTime > 0 && !gameState.cheatMode)) return;
    
    const now = Date.now();
    if (now - player.lastShot < weapon.fireRate) return;
    
    player.lastShot = now;
    
    // 计算伤害（弓箭根据蓄力时间）
    let damage = weapon.damage + player.baseDamage;
    if (weapon.name === '弓箭' && player.isCharging) {
        const chargeTime = now - player.chargeStart;
        const chargeProgress = Math.min(chargeTime / weapon.maxChargeTime, 1); // 0到1的蓄力进度
        // 伤害从最小伤害线性递增到最大伤害
        const chargeDamage = weapon.minDamage + (weapon.maxDamage - weapon.minDamage) * chargeProgress;
        damage = Math.floor(chargeDamage) + player.baseDamage;
    }
    
    // 特殊武器处理
    if (weapon.name === '霰弹枪') {
        // 发射多发子弹
        for (let i = 0; i < weapon.pelletCount; i++) {
            const spreadAngle = (Math.random() - 0.5) * weapon.spread;
            const bulletAngle = Math.atan2(player.direction.y, player.direction.x) + spreadAngle;
            
            const bullet = {
                x: player.x + Math.cos(bulletAngle) * 25,
                y: player.y + Math.sin(bulletAngle) * 25,
                vx: Math.cos(bulletAngle) * 12,
                vy: Math.sin(bulletAngle) * 12,
                radius: 2,
                damage: damage,
                color: weapon.color,
                life: 40,
                weapon: player.currentWeapon
            };
            bullets.push(bullet);
        }
    } else if (weapon.name === '火箭弹') {
        // 火箭弹
        const bullet = {
            x: player.x + player.direction.x * 25,
            y: player.y + player.direction.y * 25,
            vx: player.direction.x * 8,
            vy: player.direction.y * 8,
            radius: 6,
            damage: damage,
            splashDamage: weapon.splashDamage,
            splashRadius: weapon.splashRadius,
            color: weapon.color,
            life: 80,
            weapon: player.currentWeapon
        };
        bullets.push(bullet);
    } else if (weapon.name === '小刀' || weapon.name === '武士刀') {
        // 近战武器 - 开始挥舞动画
        player.meleeSwing = true;
        player.meleeSwingStart = Date.now();
        
        // 延迟伤害判定，在挥舞动画进行到一半时判定
        setTimeout(() => {
            const range = weapon.range;
            const angle = Math.atan2(player.direction.y, player.direction.x);
            let hitEnemy = false;
            
            // 检查范围内的敌人
            enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
                );
                
                if (distance <= range) {
                    const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                    const angleDiff = Math.abs(angle - enemyAngle);
                    
                    // 扩大攻击范围到180度，确保更容易命中
                    if (angleDiff <= Math.PI / 2) { // 180度攻击范围
                        enemy.health -= damage;
                        createHitEffect(enemy.x, enemy.y);
                        hitEnemy = true;
                        
                        // 创建伤害数字
                        createDamageNumber(enemy.x, enemy.y, damage);
                        
                        // 调试信息
                        console.log(`近战攻击命中！敌人距离: ${distance.toFixed(1)}, 角度差: ${(angleDiff * 180 / Math.PI).toFixed(1)}度, 伤害: ${damage}`);
                    }
                }
            });
            
            // 近战攻击特效 - 根据是否命中敌人显示不同效果
            if (hitEnemy) {
                createMeleeHitEffect(player.x + player.direction.x * range/2, player.y + player.direction.y * range/2, weapon.name);
            } else {
                createMeleeSwingEffect(player.x + player.direction.x * range/2, player.y + player.direction.y * range/2, weapon.name);
                console.log('近战攻击未命中');
            }
        }, 150); // 150毫秒后判定伤害
    } else {
        // 普通射击武器
        const spreadAngle = (Math.random() - 0.5) * weapon.spread;
        const bulletAngle = Math.atan2(player.direction.y, player.direction.x) + spreadAngle;
        
        const bullet = {
            x: player.x + Math.cos(bulletAngle) * 25,
            y: player.y + Math.sin(bulletAngle) * 25,
            vx: Math.cos(bulletAngle) * 15,
            vy: Math.sin(bulletAngle) * 15,
            radius: 3,
            damage: damage,
            color: weapon.color,
            life: 60,
            weapon: player.currentWeapon
        };
        bullets.push(bullet);
    }
    
    // 消耗弹药（作弊模式下不消耗）
    if (weapon.ammo !== Infinity && !gameState.cheatMode) {
        weapon.ammo--;
    }
    
    // 射击特效
    createMuzzleFlash(player.x + player.direction.x * 25, player.y + player.direction.y * 25);
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        // 追踪导弹逻辑
        if (bullet.isHoming) {
            // 追踪玩家
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                // 逐步调整方向
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                const targetVx = (dx / dist) * speed;
                const targetVy = (dy / dist) * speed;
                // 插值平滑转向
                bullet.vx = bullet.vx * 0.85 + targetVx * 0.15;
                bullet.vy = bullet.vy * 0.85 + targetVy * 0.15;
            }
        }
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        // 移除超出边界或生命值耗尽的子弹
        if (bullet.life <= 0 || 
            bullet.x < 0 || bullet.x > canvas.width || 
            bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

// 新增：关卡开始提示与状态重置
function showLevelStartDialog(level, callback) {
    const dialog = document.getElementById('levelStartDialog');
    const title = document.getElementById('levelStartTitle');
    title.textContent = `第${level}关开始`;
    dialog.classList.remove('hidden');
    // 暂停游戏主循环
    gameState.isPaused = true;
    setTimeout(() => {
        dialog.classList.add('hidden');
        // 回满血量
        player.health = player.maxHealth;
        // 回满所有武器弹药
        Object.keys(weapons).forEach(weaponKey => {
            weapons[weaponKey].ammo = weapons[weaponKey].maxAmmo;
        });
        // 恢复主循环
        gameState.isPaused = false;
        if (typeof callback === 'function') callback();
    }, 1500);
}

// 修改：每轮关卡开始时调用弹窗和状态重置
function spawnEnemies() {
    showLevelStartDialog(gameState.level, () => {
        const enemyCount = Math.min(3 + gameState.level * 2, 15);
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = Math.random() < 0.6 ? 'melee' : 'ranged';
            const typeData = enemyTypes[enemyType];
            
            const enemy = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 15 + Math.random() * 5,
                health: typeData.health,
                maxHealth: typeData.health,
                damage: typeData.damage,
                speed: typeData.speed,
                attackRange: typeData.attackRange,
                attackCooldown: typeData.attackCooldown,
                lastAttack: 0,
                color: typeData.color,
                behavior: typeData.behavior,
                type: enemyType,
                powerDamage: typeData.powerDamage || 0,
                powerShotInterval: typeData.powerShotInterval || 0,
                shotCount: 0
            };
            
            // 确保敌人不会直接生成在玩家附近
            const distToPlayer = Math.sqrt(
                Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
            );
            
            if (distToPlayer > 100) {
                enemies.push(enemy);
            }
        }
    });
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (enemy.behavior === 'melee') {
            // 近战敌人行为
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > enemy.attackRange) {
                // 移动向玩家
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed;
                    enemy.y += (dy / distance) * enemy.speed;
                }
            } else {
                // 攻击玩家
                const now = Date.now();
                if (now - enemy.lastAttack > enemy.attackCooldown) {
                    // 作弊模式下不受伤害
                    if (!gameState.cheatMode) {
                        player.health -= enemy.damage;
                    }
                    enemy.lastAttack = now;
                    createHitEffect(player.x, player.y);
                    
                    if (player.health <= 0) {
                        gameOver();
                    }
                }
            }
        } else if (enemy.behavior === 'ranged') {
            // 远程敌人行为
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 保持距离
            if (distance < enemy.attackRange * 0.5) {
                enemy.x -= (dx / distance) * enemy.speed;
                enemy.y -= (dy / distance) * enemy.speed;
            } else if (distance > enemy.attackRange) {
                enemy.x += (dx / distance) * enemy.speed * 0.5;
                enemy.y += (dy / distance) * enemy.speed * 0.5;
            }
            
            // 射击
            const now = Date.now();
            if (now - enemy.lastAttack > enemy.attackCooldown && distance <= enemy.attackRange) {
                enemy.lastAttack = now;
                enemy.shotCount++;
                
                let bulletDamage = enemy.damage;
                if (enemy.shotCount >= enemy.powerShotInterval) {
                    bulletDamage = enemy.powerDamage;
                    enemy.shotCount = 0;
                }
                
                const bullet = {
                    x: enemy.x,
                    y: enemy.y,
                    vx: (dx / distance) * 6,
                    vy: (dy / distance) * 6,
                    radius: 4,
                    damage: bulletDamage,
                    color: '#ff6b6b',
                    life: 120,
                    isEnemy: true
                };
                
                bullets.push(bullet);
            }
        }
        
        // 检查敌人是否死亡
        if (enemy.health <= 0) {
            const expGain = enemy.behavior === 'melee' ? 50 : 75;
            gainExperience(expGain);
            gameState.score += 100;
            gameState.enemiesKilled++;
            createExplosion(enemy.x, enemy.y);
            
            // 连击系统
            const currentTime = Date.now();
            if (currentTime - gameState.lastKillTime < 3000) { // 3秒内击杀算连击
                gameState.combo++;
                if (gameState.combo >= 5) { // 5连击以上有奖励
                    const comboReward = Math.floor(gameState.combo / 5) * 10; // 每5连击奖励10金币
                    gameState.coins += comboReward;
                    showComboReward(gameState.combo, comboReward);
                }
            } else {
                gameState.combo = 1;
            }
            gameState.lastKillTime = currentTime;
            
            // 掉落金币 - 根据关卡和敌人类型调整
            const baseCoinValue = 8 + gameState.level; // 基础金币价值随关卡增加
            const coinCount = Math.floor(Math.random() * 3) + 1; // 1-3个金币
            
            for (let j = 0; j < coinCount; j++) {
                const coin = {
                    x: enemy.x + (Math.random() - 0.5) * 20,
                    y: enemy.y + (Math.random() - 0.5) * 20,
                    radius: 8,
                    life: 600,
                    value: baseCoinValue + Math.floor(Math.random() * 10) // 随机额外价值
                };
                coins.push(coin);
            }
            
            // 随机掉落回复道具
            if (Math.random() < 0.2) {
                const healthPack = {
                    x: enemy.x + (Math.random() - 0.5) * 30,
                    y: enemy.y + (Math.random() - 0.5) * 30,
                    radius: 12,
                    life: 600
                };
                healthPacks.push(healthPack);
            }
            
            enemies.splice(i, 1);
        }
    }
}

function gainExperience(amount) {
    gameState.experience += amount;
    
    while (gameState.experience >= gameState.experienceToNext && gameState.playerLevel < 99) {
        gameState.experience -= gameState.experienceToNext;
        gameState.playerLevel++;
        
        // 根据自然对数计算新的最大生命值
        const newMaxHealth = Math.floor(100 + Math.log(gameState.playerLevel) * 50);
        const healthIncrease = newMaxHealth - player.maxHealth;
        player.maxHealth = newMaxHealth;
        player.health += healthIncrease;
        
        // 计算下一级所需经验
        gameState.experienceToNext = Math.floor(100 * Math.pow(1.2, gameState.playerLevel - 1));
        
        // 升级特效
        createLevelUpEffect();
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // 处理不同类型的粒子
        if (particle.type === 'damage') {
            // 伤害数字粒子
            particle.vy += particle.gravity || 0;
            particle.alpha = particle.life / 60;
        } else if (particle.type === 'slash') {
            // 斩击特效粒子
            particle.alpha = particle.life / 15;
        } else {
            // 普通粒子
            particle.alpha = particle.life / particle.maxLife;
        }
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.life--;
        
        if (powerUp.life <= 0) {
            powerUps.splice(i, 1);
        }
    }
}

function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.life--;
        if (coin.life <= 0) {
            coins.splice(i, 1);
        }
    }
}

function updateHealthPacks() {
    for (let i = healthPacks.length - 1; i >= 0; i--) {
        const healthPack = healthPacks[i];
        healthPack.life--;
        if (healthPack.life <= 0) {
            healthPacks.splice(i, 1);
        }
    }
}

function updateBoss() {
    if (!boss || !gameState.isBossLevel) return;
    
    const now = Date.now();
    
    // 更新技能冷却
    if (boss.skill1Cooldown > 0) boss.skill1Cooldown -= 16; // 约60FPS
    if (boss.skill2Cooldown > 0) boss.skill2Cooldown -= 16;
    if (boss.skill3Cooldown > 0) boss.skill3Cooldown -= 16;
    
    // 处理晕眩状态
    if (boss.stunActive) {
        if (now - boss.stunStart >= boss.stunDuration) {
            boss.stunActive = false;
        } else {
            return; // 晕眩时不能行动
        }
    }
    
    // 处理引力效果
    if (boss.gravityActive) {
        if (now - boss.gravityStart >= 3000) { // 3秒引力效果
            boss.gravityActive = false;
        } else {
            // 吸引玩家
            const dx = boss.x - player.x;
            const dy = boss.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= boss.gravityRadius && distance > 0) {
                const force = 0.5;
                player.x += (dx / distance) * force;
                player.y += (dy / distance) * force;
                
                // 如果玩家被吸到BOSS附近，触发晕眩和强化攻击
                if (distance <= boss.radius + player.radius + 10) {
                    boss.stunActive = true;
                    boss.stunStart = now;
                    
                    // 强化普通攻击
                    const angle = Math.atan2(dy, dx);
                    for (let i = 0; i < 4; i++) {
                        const spreadAngle = angle + (Math.PI / 6) * (i - 1.5);
                        const bullet = {
                            x: boss.x + Math.cos(spreadAngle) * 25,
                            y: boss.y + Math.sin(spreadAngle) * 25,
                            vx: Math.cos(spreadAngle) * 12,
                            vy: Math.sin(spreadAngle) * 12,
                            radius: 5,
                            damage: 50,
                            color: '#FF0000',
                            life: 120,
                            isEnemy: true
                        };
                        bullets.push(bullet);
                    }
                }
            }
        }
    }
    
    // 技能选择逻辑
    if (!boss.gravityActive) {
        // 随机选择技能
        const skillChoice = Math.random();
        
        if (!boss.isCharging && skillChoice < 0.3 && boss.skill1Cooldown <= 0) {
            // 地爆天星
            boss.isCharging = true;
            boss.chargeStart = now;
            boss.chargeTarget = { x: player.x, y: player.y };
        } else if (skillChoice < 0.6 && boss.skill2Cooldown <= 0) {
            // 万象天引
            boss.gravityActive = true;
            boss.gravityStart = now;
            boss.skill2Cooldown = 25000; // 25秒冷却
        } else if (skillChoice < 0.8 && boss.skill3Cooldown <= 0) {
            // 神罗天征
            bossSkill3();
            boss.skill3Cooldown = 40000; // 40秒冷却
        }
    }
    
    // 处理地爆天星蓄力
    if (boss.isCharging) {
        if (now - boss.chargeStart >= 2000) { // 2秒蓄力
            bossSkill1();
            boss.isCharging = false;
            boss.skill1Cooldown = 20000; // 20秒冷却
        }
    }
    
    // 普通攻击（无论是否在蓄力地爆天星，只要不晕眩都能攻击）
    if (!boss.stunActive && now - boss.lastAttack > boss.attackCooldown) {
        bossNormalAttack();
        boss.lastAttack = now;
    }
    
    // 简单移动（向玩家靠近）
    if (!boss.isCharging && !boss.gravityActive) {
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) { // 保持一定距离
            boss.x += (dx / distance) * boss.speed;
            boss.y += (dy / distance) * boss.speed;
        }
    }
}

function bossNormalAttack() {
    // 普通攻击：三连发子弹，三发后有50%概率发射追踪导弹
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const angle = Math.atan2(dy, dx);
    
    // 三连发
    for (let i = 0; i < 3; i++) {
        const spreadAngle = angle + (Math.PI / 12) * (i - 1);
        const bullet = {
            x: boss.x + Math.cos(spreadAngle) * 25,
            y: boss.y + Math.sin(spreadAngle) * 25,
            vx: Math.cos(spreadAngle) * 10,
            vy: Math.sin(spreadAngle) * 12,
            radius: 4,
            damage: 25,
            color: '#000000',
            life: 120,
            isEnemy: true
        };
        bullets.push(bullet);
    }
    // 计数
    boss.normalAttackCount = (boss.normalAttackCount || 0) + 1;
    if (boss.normalAttackCount >= 3) {
        boss.normalAttackCount = 0;
        if (Math.random() < 0.5) {
            // 发射追踪导弹
            const missileAngle = angle;
            const missile = {
                x: boss.x + Math.cos(missileAngle) * 30,
                y: boss.y + Math.sin(missileAngle) * 30,
                vx: Math.cos(missileAngle) * 7,
                vy: Math.sin(missileAngle) * 7,
                radius: 7,
                damage: 45,
                color: '#9400D3',
                life: 150,
                isEnemy: true,
                isHoming: true // 追踪标记
            };
            bullets.push(missile);
        }
    }
}

function bossSkill1() {
    // 地爆天星：棕色巨大球体
    const dx = boss.chargeTarget.x - boss.x;
    const dy = boss.chargeTarget.y - boss.y;
    const angle = Math.atan2(dy, dx);
    
    const bullet = {
        x: boss.x + Math.cos(angle) * 30,
        y: boss.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        radius: 40, // 更大球体
        damage: Math.floor(player.health * 0.2), // 20%当前生命值
        color: '#8B4513',
        life: 150,
        isEnemy: true
    };
    bullets.push(bullet);
    
    // 创建蓄力特效
    createBossChargeEffect(boss.x, boss.y);
}

function bossSkill3() {
    // 神罗天征：全图冲击波
    if (!gameState.isInvincible) {
        const damage = Math.floor(player.maxHealth * 0.15); // 15%最大生命值
        let finalDamage = damage;
        
        if (player.shield > 0) {
            const shieldAbsorb = Math.min(player.shield, finalDamage);
            player.shield -= shieldAbsorb;
            finalDamage -= shieldAbsorb;
        }
        
        if (finalDamage > 0) {
            finalDamage = Math.max(1, finalDamage - player.defense);
            player.health -= finalDamage;
        }
    }
    
    // 创建冲击波特效
    createShockwaveEffect();
}

function createBossChargeEffect(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = 4 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#8B4513',
            life: 40,
            maxLife: 40,
            alpha: 1
        });
    }
}

function createShockwaveEffect() {
    // 创建从BOSS位置扩散的冲击波特效
    for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const speed = 5 + Math.random() * 3;
        particles.push({
            x: boss.x,
            y: boss.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#FF4500',
            life: 60,
            maxLife: 60,
            alpha: 1,
            type: 'shockwave'
        });
    }
}

function defeatBoss() {
    gameState.bossDefeated = true;
    gameState.isBossLevel = false;
    
    // BOSS奖励
    gameState.coins += 150;
    gameState.score += 1000;
    
    // 显示击败提示
    showBossDefeatMessage();
    
    // 清除BOSS
    boss = null;
    
    // 进入下一关
    setTimeout(() => {
        gameState.level++;
        openShop();
    }, 3000);
}

function showBossDefeatMessage() {
    // 移除旧弹窗
    const old = document.getElementById('bossVictoryDialog');
    if (old) old.parentNode.removeChild(old);
    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.id = 'bossVictoryDialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: white;
        padding: 40px 60px 30px 60px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        z-index: 2000;
        text-align: center;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    `;
    dialog.innerHTML = `
        <div style="font-size:38px;margin-bottom:18px;letter-spacing:8px;">大捷</div>
        <div style="font-size:20px;margin-bottom:30px;">🎉 BOSS击败！获得150金币！</div>
        <div style="margin-top:10px;">
            <button id="btnVictoryContinue" style="font-size:20px;padding:8px 32px;margin:0 10px 0 0;background:#32CD32;color:#fff;border:none;border-radius:8px;cursor:pointer;">继续战斗</button>
            <button id="btnVictoryExit" style="font-size:20px;padding:8px 32px;margin:0 0 0 10px;background:#B22222;color:#fff;border:none;border-radius:8px;cursor:pointer;">退出游戏</button>
        </div>
    `;
    document.body.appendChild(dialog);
    // 绑定按钮事件
    document.getElementById('btnVictoryContinue').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        // 进入下一关
        setTimeout(() => {
            gameState.level++;
            openShop();
        }, 0);
    };
    document.getElementById('btnVictoryExit').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        gameState.isRunning = false;
        // 可选：如有exitGame函数可调用，否则仅停止游戏
    };
}

function openShop() {
    gameState.showShop = true;
    gameState.isPaused = true;
    gameState.shopTimer = gameState.shopTimeLimit; // 重置倒计时
    gameState.shopTimeLimitBase = gameState.shopTimeLimit; // 重置基础时间限制
    gameState.lastTime = performance.now(); // 重置时间基准
    generateShopItems();
    updateShopUI();
    document.getElementById('shopScreen').classList.remove('hidden');
}

function generateShopItems() {
    gameState.shopItems = [];
    const availableItems = Object.keys(shopItems);
    // 根据关卡调整稀有物品出现概率
    const rarityMultiplier = Math.min(gameState.level / 5, 2); // 每5关增加稀有度
    // 随机选择6个商品，避免重复
    const selectedItems = [];
    for (let i = 0; i < 6 && selectedItems.length < availableItems.length; i++) {
        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        if (!selectedItems.includes(randomItem)) {
            // 检查是否为稀有物品
            const baseItem = shopItems[randomItem];
            const isRare = baseItem.cost >= 300; // 价格300以上的为稀有物品
            const isReviveCoin = randomItem === 'reviveCoin'; // 复活币特殊处理
            // 复活币有极低的出现概率，且不能超过最大数量
            if (isReviveCoin && (Math.random() > 0.1 * rarityMultiplier || player.reviveCoins >= player.maxReviveCoins)) {
                continue; // 跳过复活币
            }
            // 其他稀有物品有较低的出现概率
            else if (isRare && !isReviveCoin && Math.random() > 0.3 * rarityMultiplier) {
                continue; // 跳过这个稀有物品
            }
            // 价格浮动：金币越多价格越高，浮动系数可调
            const priceMultiplier = 1 + gameState.coins / 2000;
            const floatCost = Math.round(baseItem.cost * priceMultiplier);
            // 复制item并动态赋值cost
            const item = { ...baseItem, cost: floatCost };
            selectedItems.push(randomItem);
            gameState.shopItems.push(item);
        }
    }
}

function buyItem(itemIndex) {
    const item = gameState.shopItems[itemIndex];
    if (gameState.coins >= item.cost) {
        gameState.coins -= item.cost;
        applyItemEffect(item);
        gameState.shopItems.splice(itemIndex, 1);
        updateShopUI();
        
        // 显示购买成功提示
        showPurchaseSuccess(item.name);
    }
}

function showPurchaseSuccess(itemName) {
    // 创建临时提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    notification.textContent = `购买成功: ${itemName}`;
    document.body.appendChild(notification);
    
    // 2秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

function applyItemEffect(item) {
    switch (item.effect) {
        case 'speed':
            player.baseSpeed += item.value;
            break;
        case 'damage':
            player.baseDamage += item.value;
            break;
        case 'defense':
            player.defense += item.value;
            break;
        case 'shield':
            player.maxShield += item.value;
            player.shield = player.maxShield;
            break;
        case 'attackSpeed':
            player.attackSpeed += item.value;
            break;
        case 'health':
            player.maxHealth += item.value;
            player.health += item.value;
            break;
        case 'healEffect':
            player.healEffect += item.value;
            break;
        case 'pickupRange':
            player.pickupRange += item.value;
            break;
        case 'autoFire':
            player.autoFire = true;
            break;
        case 'autoPickup':
            player.autoPickup = true;
            break;
        case 'autoReload':
            player.autoReload = true;
            break;
        case 'clone':
            player.clone = {
                x: player.x,
                y: player.y,
                health: player.maxHealth * 0.5,
                maxHealth: player.maxHealth * 0.5,
                damage: player.baseDamage * 0.5,
                speed: player.baseSpeed * 0.5
            };
            player.cloneActive = true;
            player.cloneHealth = player.clone.maxHealth;
            break;
        case 'invincible':
            player.invincible = true;
            break;
        case 'thirdWeapon':
            player.thirdWeapon = true;
            break;
        case 'reviveCoin':
            if (player.reviveCoins < player.maxReviveCoins) {
                player.reviveCoins += item.value;
                showPurchaseSuccess(`获得复活币！当前: ${player.reviveCoins}/${player.maxReviveCoins}`);
            } else {
                showPurchaseError('已达到最大复活币数量');
                // 退还金币
                gameState.coins += item.cost;
            }
            break;
        case 'weapon':
            if (player.weapons.length < (player.thirdWeapon ? 3 : 2)) {
                // 武器槽未满，直接添加
                player.weapons.push(item.value);
            } else {
                // 武器槽已满，显示武器交换界面
                showWeaponSwapDialog(item.value);
            }
            break;
        case 'lifeSteal':
            player.lifeSteal += item.value;
            showPurchaseSuccess('吸血属性提升！当前吸血：' + Math.round(player.lifeSteal * 100) + '%');
            break;
    }
}

function closeShop() {
    gameState.showShop = false;
    gameState.isPaused = false;
    document.getElementById('shopScreen').classList.add('hidden');
    spawnEnemies();
}

function refreshShop() {
    if (gameState.coins >= 25) {
        gameState.coins -= 25;
        generateShopItems();
        updateShopUI();
        showPurchaseSuccess('商店已刷新');
    } else {
        showPurchaseError('金币不足');
    }
}

function extendShopTime() {
    if (gameState.coins >= 15) {
        gameState.coins -= 15;
        gameState.shopTimer += 15; // 延长15秒
        gameState.shopTimeLimitBase += 15; // 同时更新基础时间限制
        updateShopUI();
        showPurchaseSuccess('时间延长15秒');
    } else {
        showPurchaseError('金币不足');
    }
}

function getItemType(item) {
    if (item.effect === 'weapon') return '武器';
    if (['autoFire', 'autoPickup', 'autoReload', 'clone', 'invincible', 'thirdWeapon', 'reviveCoin'].includes(item.effect)) return '特殊道具';
    return '属性提升';
}

function updateShopTimer() {
    const timerElement = document.getElementById('shopTimer');
    const timerBar = document.getElementById('timerBar');
    
    if (timerElement) {
        const minutes = Math.floor(gameState.shopTimer / 60);
        const seconds = Math.floor(gameState.shopTimer % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = timeString;
        
        // 更新进度条
        if (timerBar) {
            const progress = (gameState.shopTimer / gameState.shopTimeLimitBase) * 100;
            timerBar.style.width = `${Math.max(0, progress)}%`;
            
            // 根据剩余时间改变进度条颜色
            if (gameState.shopTimer <= 10) {
                timerBar.style.background = 'linear-gradient(90deg, #ff4500, #ff6347)';
            } else if (gameState.shopTimer <= 20) {
                timerBar.style.background = 'linear-gradient(90deg, #ffd700, #ffed4e)';
            } else {
                timerBar.style.background = 'linear-gradient(90deg, #4a90e2, #357abd)';
            }
        }
        
        // 根据剩余时间改变颜色
        if (gameState.shopTimer <= 10) {
            timerElement.style.color = '#ff4500'; // 红色警告
            timerElement.style.animation = 'pulse 1s infinite';
        } else if (gameState.shopTimer <= 20) {
            timerElement.style.color = '#ffd700'; // 黄色警告
            timerElement.style.animation = 'none';
        } else {
            timerElement.style.color = '#4a90e2'; // 正常蓝色
            timerElement.style.animation = 'none';
        }
    }
}

function autoCloseShop() {
    showPurchaseError('时间到！商店自动关闭');
    closeShop();
}

function showTimeWarning() {
    // 创建时间警告提示
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 69, 0, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        z-index: 1000;
        animation: timeWarning 0.5s ease-in-out;
    `;
    warning.textContent = '⚠️ 时间快到了！';
    document.body.appendChild(warning);
    
    // 0.5秒后移除警告
    setTimeout(() => {
        if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
        }
    }, 500);
}

function showPurchaseError(message) {
    // 创建临时提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 2秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

function showLevelReward(amount) {
    // 创建关卡奖励提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: white;
        padding: 25px 35px;
        border-radius: 15px;
        font-size: 20px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 3s ease-in-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `🎉 关卡完成！<br>获得 ${amount} 金币奖励！`;
    document.body.appendChild(notification);
    
    // 3秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showComboReward(combo, reward) {
    // 创建连击奖励提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FF6B6B, #FF8E53);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `🔥 ${combo} 连击！<br>+${reward} 金币`;
    document.body.appendChild(notification);
    
    // 2秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

function showReviveMessage() {
    // 创建复活提示元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #00FF00, #32CD32);
        color: white;
        padding: 25px 35px;
        border-radius: 15px;
        font-size: 20px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 3s ease-in-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `🔄 复活成功！<br>剩余复活币: ${player.reviveCoins}`;
    document.body.appendChild(notification);
    
    // 3秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// BOSS挑战次数
let bossAttemptsMax = 2; // 最多2次

function startBossBattle() {
    gameState.isBossLevel = true;
    gameState.bossAttempts = bossAttemptsMax; // 初始化为2次
    
    // 创建BOSS
    boss = {
        name: '天道·超',
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 30, // 比玩家稍大
        health: 5000,
        maxHealth: 5000,
        speed: 1.5,
        color: '#8B0000',
        // 技能冷却
        skill1Cooldown: 0, // 地爆天星
        skill2Cooldown: 0, // 万象天引
        skill3Cooldown: 0, // 神罗天征
        // 技能状态
        isCharging: false,
        chargeStart: 0,
        chargeTarget: null,
        // 引力效果
        gravityActive: false,
        gravityStart: 0,
        gravityRadius: 300, // 吸附范围更大
        // 晕眩效果
        stunActive: false,
        stunStart: 0,
        stunDuration: 1000, // 1秒晕眩
        // 攻击相关
        lastAttack: 0,
        attackCooldown: 1500, // 普通攻击冷却1.5秒
        normalAttackCount: 0 // 普通攻击计数器
    };
    
    // 显示BOSS来临提示
    showBossWarning();
    
    // 清除所有敌人和子弹
    enemies.length = 0;
    bullets.length = 0;
}

function showBossWarning() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FF4500, #DC143C);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 4s ease-in-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    `;
    notification.innerHTML = `⚠️ BOSS来临！<br><span style="font-size: 28px; color: #FFD700;">天道·超</span>`;
    document.body.appendChild(notification);
    
    // 4秒后移除提示
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

function showWeaponSwapDialog(newWeaponKey) {
    // 创建武器交换对话框
    const dialog = document.createElement('div');
    dialog.id = 'weaponSwapDialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 30px;
        border-radius: 15px;
        border: 3px solid #4a90e2;
        box-shadow: 0 0 50px rgba(74, 144, 226, 0.8);
        z-index: 1000;
        text-align: center;
        min-width: 400px;
    `;
    
    const newWeapon = weapons[newWeaponKey];
    dialog.innerHTML = `
        <h3 style="color: #ffd700; margin-bottom: 20px;">武器槽已满</h3>
        <p style="margin-bottom: 15px;">你获得了新武器：<span style="color: #4a90e2; font-weight: bold;">${newWeapon.name}</span></p>
        <p style="margin-bottom: 20px; color: #ccc;">选择要替换的武器：</p>
        <div id="weaponOptions" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
        </div>
        <button id="cancelWeaponSwap" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">取消</button>
    `;
    
    document.body.appendChild(dialog);
    
    // 添加武器选项
    const weaponOptions = document.getElementById('weaponOptions');
    player.weapons.forEach((weaponKey, index) => {
        const weapon = weapons[weaponKey];
        const option = document.createElement('button');
        option.style.cssText = `
            background: linear-gradient(45deg, #4a90e2, #357abd);
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            min-width: 120px;
        `;
        option.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 5px;">${weapon.name}</div>
            <div style="font-size: 12px; color: #ccc;">伤害: ${weapon.damage}</div>
        `;
        
        option.onmouseover = () => {
            option.style.transform = 'translateY(-2px)';
            option.style.boxShadow = '0 5px 15px rgba(74, 144, 226, 0.3)';
        };
        
        option.onmouseout = () => {
            option.style.transform = 'translateY(0)';
            option.style.boxShadow = 'none';
        };
        
        option.onclick = () => {
            // 替换武器
            player.weapons[index] = newWeaponKey;
            
            // 如果替换的是当前武器索引对应的武器，更新当前武器
            if (player.weaponIndex === index) {
                player.currentWeapon = newWeaponKey;
            }
            
            showPurchaseSuccess(`已替换为 ${newWeapon.name}`);
            document.body.removeChild(dialog);
        };
        
        weaponOptions.appendChild(option);
    });
    
    // 取消按钮
    document.getElementById('cancelWeaponSwap').onclick = () => {
        document.body.removeChild(dialog);
    };
}

function updateShopUI() {
    const shopContainer = document.getElementById('shopItems');
    shopContainer.innerHTML = '';
    
    if (gameState.shopItems.length === 0) {
        shopContainer.innerHTML = '<p style="text-align: center; color: #ccc; grid-column: 1 / -1;">商店暂时没有商品</p>';
        return;
    }
    
    gameState.shopItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        const canAfford = gameState.coins >= item.cost;
        const itemType = getItemType(item);
        const rarityClass = item.cost >= 300 ? 'rare' : item.cost >= 200 ? 'uncommon' : 'common';
        itemDiv.innerHTML = `
            <div class="item-header ${rarityClass}">
                <h3>${item.name}</h3>
                <span class="item-type">${itemType}</span>
            </div>
            <p>${item.description}</p>
            <p class="cost">价格: ${item.cost} 金币</p>
            <button onclick="buyItem(${index})" ${!canAfford ? 'disabled' : ''} class="${canAfford ? 'buyable' : 'unaffordable'}">
                ${!canAfford ? '金币不足' : '购买'}
            </button>
        `;
        shopContainer.appendChild(itemDiv);
    });
    
    document.getElementById('playerCoins').textContent = gameState.coins;
    document.getElementById('currentLevel').textContent = gameState.level;
}

function updateWeaponDisplay() {
    const display = document.getElementById('weaponDisplayValue');
    if (!display) return;
    // 只显示现有武器名称
    display.textContent = player.weapons.map(w => weapons[w]?.name || '').filter(Boolean).join(' ');
    // 增加吸血属性显示
    const lifeStealElement = document.getElementById('lifeStealValue');
    if (lifeStealElement) {
        lifeStealElement.textContent = Math.round(player.lifeSteal * 100) + '%';
    }
}

function checkCollisions() {
    // 自动拾取金币和回复道具
    if (player.autoPickup) {
        // 直接拾取所有金币
        for (let i = coins.length - 1; i >= 0; i--) {
            gameState.coins += coins[i].value;
            createCoinPickupEffect(coins[i].x, coins[i].y);
            coins.splice(i, 1);
        }
        // 直接拾取所有回复道具
        for (let i = healthPacks.length - 1; i >= 0; i--) {
            const healAmount = Math.floor(player.maxHealth * 0.1 * player.healEffect);
            player.health = Math.min(player.maxHealth, player.health + healAmount);
            createHealEffect(healthPacks[i].x, healthPacks[i].y);
            healthPacks.splice(i, 1);
        }
    }
    // 子弹与敌人碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.isEnemy) continue;
        
        // 检查与BOSS的碰撞
        if (boss && gameState.isBossLevel) {
            const bossDistance = Math.sqrt(
                Math.pow(bullet.x - boss.x, 2) + Math.pow(bullet.y - boss.y, 2)
            );
            
            if (bossDistance < boss.radius + bullet.radius) {
                boss.health -= bullet.damage;
                // 吸血回血
                if (player.lifeSteal > 0) {
                    const heal = Math.floor(bullet.damage * player.lifeSteal);
                    if (heal > 0) {
                        player.health = Math.min(player.maxHealth, player.health + heal);
                        createHealEffect(player.x, player.y);
                    }
                }
                bullets.splice(i, 1);
                createHitEffect(bullet.x, bullet.y);
                
                // 30%概率掉落血包和金币
                if (Math.random() < 0.3) {
                    // 掉落血包
                    const healthPack = {
                        x: boss.x + (Math.random() - 0.5) * 40,
                        y: boss.y + (Math.random() - 0.5) * 40,
                        radius: 12,
                        life: 600
                    };
                    healthPacks.push(healthPack);
                    
                    // 掉落金币
                    const coin = {
                        x: boss.x + (Math.random() - 0.5) * 40,
                        y: boss.y + (Math.random() - 0.5) * 40,
                        radius: 8,
                        life: 600,
                        value: 20 + Math.floor(Math.random() * 10)
                    };
                    coins.push(coin);
                }
                
                // 火箭弹溅射伤害
                if (bullet.weapon === 'rocket' && bullet.splashDamage) {
                    createSplashDamage(bullet.x, bullet.y, bullet.splashRadius, bullet.splashDamage);
                }
                
                continue;
            }
        }
        
        // 检查与普通敌人的碰撞
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const distance = Math.sqrt(
                Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
            );
            
            if (distance < enemy.radius + bullet.radius) {
                enemy.health -= bullet.damage;
                // 吸血回血
                if (player.lifeSteal > 0) {
                    const heal = Math.floor(bullet.damage * player.lifeSteal);
                    if (heal > 0) {
                        player.health = Math.min(player.maxHealth, player.health + heal);
                        createHealEffect(player.x, player.y);
                    }
                }
                bullets.splice(i, 1);
                createHitEffect(bullet.x, bullet.y);
                
                // 火箭弹溅射伤害
                if (bullet.weapon === 'rocket' && bullet.splashDamage) {
                    createSplashDamage(bullet.x, bullet.y, bullet.splashRadius, bullet.splashDamage);
                }
                
                break;
            }
        }
    }
    
    // 敌人子弹与玩家碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.isEnemy) continue;
        
        const distance = Math.sqrt(
            Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2)
        );
        
        if (distance < player.radius + bullet.radius && !gameState.isInvincible && !gameState.cheatMode) {
            let damage = bullet.damage;
            
            // 护盾优先吸收伤害
            if (player.shield > 0) {
                const shieldAbsorb = Math.min(player.shield, damage);
                player.shield -= shieldAbsorb;
                damage -= shieldAbsorb;
            }
            
            // 防御力减少伤害
            if (damage > 0) {
                damage = Math.max(1, damage - player.defense);
                player.health -= damage;
            }
            
            bullets.splice(i, 1);
            createHitEffect(bullet.x, bullet.y);
            
            if (player.health <= 0) {
                gameOver();
            }
        }
    }
    
    // 玩家与金币碰撞
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        const distance = Math.sqrt(
            Math.pow(coin.x - player.x, 2) + Math.pow(coin.y - player.y, 2)
        );
        
        if (distance < player.pickupRange) {
            gameState.coins += coin.value;
            coins.splice(i, 1);
            createCoinPickupEffect(coin.x, coin.y);
        }
    }
    
    // 玩家与回复道具碰撞
    for (let i = healthPacks.length - 1; i >= 0; i--) {
        const healthPack = healthPacks[i];
        const distance = Math.sqrt(
            Math.pow(healthPack.x - player.x, 2) + Math.pow(healthPack.y - player.y, 2)
        );
        
        if (distance < player.pickupRange) {
            const healAmount = Math.floor(player.maxHealth * 0.1 * player.healEffect);
            player.health = Math.min(player.maxHealth, player.health + healAmount);
            healthPacks.splice(i, 1);
            createHealEffect(healthPack.x, healthPack.y);
        }
    }
}

function createSplashDamage(x, y, radius, damage) {
    enemies.forEach(enemy => {
        const distance = Math.sqrt(
            Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2)
        );
        
        if (distance <= radius) {
            const damageMultiplier = 1 - (distance / radius);
            enemy.health -= Math.floor(damage * damageMultiplier);
        }
    });
}

function createMuzzleFlash(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 3 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ffd700',
            life: 10,
            maxLife: 10,
            alpha: 1
        });
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ff6b6b',
            life: 15,
            maxLife: 15,
            alpha: 1
        });
    }
}

function createDamageNumber(x, y, damage) {
    particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -3 - Math.random() * 2,
        life: 60,
        color: '#FF4500',
        size: 16,
        type: 'damage',
        text: damage.toString(),
        gravity: 0.1
    });
}

function createMeleeHitEffect(x, y, weaponName) {
    const color = weaponName === '小刀' ? '#C0C0C0' : '#FFD700';
    const particleCount = weaponName === '小刀' ? 8 : 12;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 25,
            maxLife: 25,
            alpha: 1
        });
    }
    
    // 添加武器特有的特效
    if (weaponName === '武士刀') {
        // 武士刀斩击特效
        for (let i = 0; i < 6; i++) {
            const angle = Math.atan2(player.direction.y, player.direction.x) + (Math.random() - 0.5) * 0.5;
            const speed = 4 + Math.random() * 2;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#FFD700',
                life: 15,
                maxLife: 15,
                alpha: 1,
                type: 'slash'
            });
        }
    }
}

function createMeleeSwingEffect(x, y, weaponName) {
    const color = weaponName === '小刀' ? '#C0C0C0' : '#FFD700';
    const particleCount = weaponName === '小刀' ? 6 : 8;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 15,
            maxLife: 15,
            alpha: 0.7
        });
    }
}

function createMeleeEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#C0C0C0',
            life: 20,
            maxLife: 20,
            alpha: 1
        });
    }
}

function createLevelUpEffect() {
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#00FF00',
            life: 40,
            maxLife: 40,
            alpha: 1
        });
    }
}

function createCoinPickupEffect(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#FFD700',
            life: 20,
            maxLife: 20,
            alpha: 1
        });
    }
}

function createHealEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#00FF00',
            life: 25,
            maxLife: 25,
            alpha: 1
        });
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 1 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: `hsl(${30 + Math.random() * 30}, 100%, 50%)`,
            life: 30 + Math.random() * 20,
            maxLife: 30 + Math.random() * 20,
            alpha: 1
        });
    }
}

function updateUI() {
    document.getElementById('scoreValue').textContent = gameState.score;
    document.getElementById('healthValue').textContent = Math.max(0, Math.floor(player.health));
    document.getElementById('ammoValue').textContent = weapons[player.currentWeapon].ammo;
    document.getElementById('levelValue').textContent = gameState.level;
    
    // 更新玩家等级和经验值显示
    const levelElement = document.getElementById('playerLevelValue');
    const expElement = document.getElementById('playerExp');
    if (levelElement) levelElement.textContent = gameState.playerLevel;
    if (expElement) expElement.textContent = `${gameState.experience}/${gameState.experienceToNext}`;
    
    // 更新金币显示
    const coinsElement = document.getElementById('coinsValue');
    if (coinsElement) coinsElement.textContent = gameState.coins;
    
    // 更新连击显示
    const comboElement = document.getElementById('comboValue');
    if (comboElement) {
        if (gameState.combo > 1) {
            comboElement.textContent = `${gameState.combo} 连击`;
            comboElement.style.display = 'block';
        } else {
            comboElement.style.display = 'none';
        }
    }
    
    // 更新武器显示
    updateWeaponDisplay();
    
    // 更新复活币显示和作弊模式显示
    const reviveElement = document.getElementById('reviveValue');
    if (reviveElement) {
        if (gameState.cheatMode) {
            reviveElement.textContent = `${player.reviveCoins}/${player.maxReviveCoins} [作弊]`;
            reviveElement.style.color = '#8A2BE2';
            reviveElement.style.fontWeight = 'bold';
        } else {
            reviveElement.textContent = `${player.reviveCoins}/${player.maxReviveCoins}`;
            reviveElement.style.color = '';
            reviveElement.style.fontWeight = '';
        }
    }
    
    // 更新BOSS挑战次数显示
    const bossAttemptsElement = document.getElementById('bossAttemptsValue');
    if (bossAttemptsElement) {
        if (gameState.isBossLevel) {
            bossAttemptsElement.textContent = `${gameState.bossAttempts}/${bossAttemptsMax}`;
            bossAttemptsElement.style.display = 'block';
        } else {
            bossAttemptsElement.style.display = 'none';
        }
    }
}

function gameOver() {
    // 检查是否有复活币
    if (player.reviveCoins > 0) {
        // 使用复活币复活
        player.reviveCoins--;
        player.health = player.maxHealth * 0.5; // 复活后恢复50%生命值
        player.shield = 0; // 清空护盾
        
        // 清除所有敌人子弹
        bullets = bullets.filter(bullet => !bullet.isEnemy);
        
        // 短暂无敌时间
        gameState.isInvincible = true;
        gameState.invincibleTimer = 120; // 2秒无敌时间
        
        // 显示复活提示
        showReviveMessage();
        
        // 重置连击
        gameState.combo = 0;
        
        return; // 不结束游戏
    }
    
    // BOSS挑战失败处理
    if (gameState.isBossLevel) {
        gameState.bossAttempts--;
        
        if (gameState.bossAttempts > 0) {
            // 还有挑战机会
            showBossRetryMessage();
            
            // 重置玩家位置和状态
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
            player.health = player.maxHealth;
            player.shield = player.maxShield;
            
            // 重置BOSS
            if (boss) {
                boss.health = boss.maxHealth;
                boss.x = canvas.width / 2;
                boss.y = canvas.height / 2;
                boss.skill1Cooldown = 0;
                boss.skill2Cooldown = 0;
                boss.skill3Cooldown = 0;
                boss.isCharging = false;
                boss.gravityActive = false;
                boss.stunActive = false;
            }
            
            // 清除子弹
            bullets.splice(0, bullets.length);
            
            return; // 重新挑战，不结束游戏
        } else {
            // 挑战次数用完，重新开始游戏
            showBossGameOverMessage();
            setTimeout(() => {
                restartGame();
            }, 3000);
            return;
        }
    }
    
    // 没有复活币，游戏结束
    gameState.isRunning = false;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.playerLevel;
    document.getElementById('gameOver').classList.remove('hidden');
}

function showBossRetryMessage() {
    // 移除旧弹窗
    const old = document.getElementById('bossRetryDialog');
    if (old) old.parentNode.removeChild(old);
    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.id = 'bossRetryDialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFA500, #FF8C00);
        color: white;
        padding: 40px 60px 30px 60px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        z-index: 2000;
        text-align: center;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        pointer-events: auto;
    `;
    dialog.innerHTML = `
        <div style="font-size:38px;margin-bottom:18px;letter-spacing:8px;">重新与神战斗</div>
        <div style="font-size:20px;margin-bottom:30px;">你还有<span style='color:#FFD700;font-size:26px;'>${gameState.bossAttempts}</span>次与神的战斗机会（共${bossAttemptsMax}次）</div>
        <div style="margin-top:10px;">
            <button id="btnContinueBattle" style="font-size:20px;padding:8px 32px;margin:0 10px 0 0;background:#32CD32;color:#fff;border:none;border-radius:8px;cursor:pointer;">重新与神战斗</button>
            <button id="btnRestartGame" style="font-size:20px;padding:8px 32px;margin:0 10px;background:#1E90FF;color:#fff;border:none;border-radius:8px;cursor:pointer;">重新开始</button>
            <button id="btnExitGame" style="font-size:20px;padding:8px 32px;margin:0 0 0 10px;background:#B22222;color:#fff;border:none;border-radius:8px;cursor:pointer;">退出游戏</button>
        </div>
    `;
    document.body.appendChild(dialog);
    // 禁止玩家操作
    gameState.isPaused = true;
    // 绑定按钮事件
    document.getElementById('btnContinueBattle').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        // 彻底重置玩家状态
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        player.health = player.maxHealth;
        player.shield = player.maxShield;
        // 重新开始BOSS战（彻底重置BOSS状态和场景）
        startBossBattle();
        gameState.isPaused = false;
    };
    document.getElementById('btnRestartGame').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        restartGame();
    };
    document.getElementById('btnExitGame').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        gameState.isRunning = false;
        // 可选：如有exitGame函数可调用，否则仅停止游戏
    };
}

function showBossGameOverMessage() {
    // 移除旧弹窗
    const old = document.getElementById('bossGameOverDialog');
    if (old) old.parentNode.removeChild(old);
    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.id = 'bossGameOverDialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #DC143C, #B22222);
        color: white;
        padding: 40px 60px 30px 60px;
        border-radius: 20px;
        font-size: 24px;
        font-weight: bold;
        z-index: 2000;
        text-align: center;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    `;
    dialog.innerHTML = `
        <div style="font-size:38px;margin-bottom:18px;letter-spacing:8px;">菜就多练</div>
        <div style="font-size:20px;margin-bottom:30px;">你已用尽所有与神的战斗机会</div>
        <div style="margin-top:10px;">
            <button id="btnRestartGameFinal" style="font-size:20px;padding:8px 32px;margin:0 10px;background:#1E90FF;color:#fff;border:none;border-radius:8px;cursor:pointer;">重新开始</button>
            <button id="btnExitGameFinal" style="font-size:20px;padding:8px 32px;margin:0 0 0 10px;background:#B22222;color:#fff;border:none;border-radius:8px;cursor:pointer;">退出游戏</button>
        </div>
    `;
    document.body.appendChild(dialog);
    document.getElementById('btnRestartGameFinal').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        restartGame();
    };
    document.getElementById('btnExitGameFinal').onclick = function() {
        dialog.parentNode.removeChild(dialog);
        gameState.isRunning = false;
    };
}

function activateCheatMode() {
    if (gameState.cheatMode) {
        // 如果已经激活，则关闭作弊模式
        gameState.cheatMode = false;
        player.color = '#4ECDC4'; // 恢复原色
        player.autoFire = false;
        showCheatModeMessage('作弊模式已关闭', '#FF4500');
    } else {
        // 激活作弊模式
        gameState.cheatMode = true;
        player.color = '#8A2BE2'; // 紫色
        player.autoFire = true;
        showCheatModeMessage('作弊模式已激活！<br>无限生命 | 无需换弹 | 自动射击', '#8A2BE2');
    }
}

function showCheatModeMessage(message, color) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, ${color}, #4B0082);
        color: white;
        padding: 25px 35px;
        border-radius: 15px;
        font-size: 18px;
        font-weight: bold;
        z-index: 1000;
        animation: fadeInOut 3s ease-in-out;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function render() {
    // 清空画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景
    drawGrid();
    
    // 绘制道具
    drawPowerUps();
    
    // 绘制金币
    drawCoins();
    
    // 绘制回复道具
    drawHealthPacks();
    
    // 绘制粒子
    drawParticles();
    
    // 绘制子弹
    drawBullets();
    
    // 绘制敌人
    drawEnemies();
    
    // 绘制BOSS
    if (boss && gameState.isBossLevel) {
        drawBoss();
    }
    
    // 绘制分身
    if (player.cloneActive && player.clone) {
        drawClone();
    }
    
    // 绘制玩家
    drawPlayer();
    
    // 绘制UI
    drawGameUI();
}

function drawGrid() {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayer() {
    // 无敌状态效果
    if (gameState.isInvincible) {
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 护盾效果
    if (player.shield > 0) {
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 玩家身体
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 玩家朝向指示器
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + player.direction.x * 30,
        player.y + player.direction.y * 30
    );
    ctx.stroke();
    
    // 生命值条
    const barWidth = 40;
    const barHeight = 4;
    const healthPercent = player.health / player.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - barWidth/2, player.y - player.radius - 10, barWidth, barHeight);
    
    ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
    ctx.fillRect(player.x - barWidth/2, player.y - player.radius - 10, barWidth * healthPercent, barHeight);
    
    // 护盾条
    if (player.maxShield > 0) {
        const shieldPercent = player.shield / player.maxShield;
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(player.x - barWidth/2, player.y - player.radius - 15, barWidth * shieldPercent, barHeight);
    }
    
    // 弓箭蓄力指示器
    if (player.isCharging && weapons[player.currentWeapon].name === '弓箭') {
        const weapon = weapons[player.currentWeapon];
        const chargeTime = Date.now() - player.chargeStart;
        const chargeProgress = Math.min(chargeTime / weapon.maxChargeTime, 1); // 0到1的蓄力进度
        
        // 计算当前伤害
        const currentDamage = Math.floor(weapon.minDamage + (weapon.maxDamage - weapon.minDamage) * chargeProgress);
        
        // 蓄力圆圈指示器
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2 * chargeProgress);
        ctx.stroke();
        
        // 显示当前伤害
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentDamage}`, player.x, player.y - player.radius - 25);
        
        // 显示蓄力进度条
        const barWidth = 40;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - barWidth/2, player.y - player.radius - 35, barWidth, barHeight);
        
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(player.x - barWidth/2, player.y - player.radius - 35, barWidth * chargeProgress, barHeight);
    }
    
    // 近战武器挥舞动画
    if (player.meleeSwing) {
        const weapon = weapons[player.currentWeapon];
        const swingTime = Date.now() - player.meleeSwingStart;
        const swingProgress = swingTime / player.meleeSwingDuration;
        
        // 计算挥舞角度（从-30度到+30度，总共60度）
        const swingAngle = (swingProgress - 0.5) * Math.PI / 3; // -30度到+30度
        const baseAngle = Math.atan2(player.direction.y, player.direction.x);
        const finalAngle = baseAngle + swingAngle;
        
        // 绘制武器
        const weaponLength = weapon.name === '小刀' ? 25 : 35;
        const weaponColor = weapon.name === '小刀' ? '#C0C0C0' : '#FFD700';
        const weaponWidth = weapon.name === '小刀' ? 3 : 5;
        
        ctx.strokeStyle = weaponColor;
        ctx.lineWidth = weaponWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            player.x + Math.cos(finalAngle) * weaponLength,
            player.y + Math.sin(finalAngle) * weaponLength
        );
        ctx.stroke();
        
        // 武器挥舞轨迹
        ctx.strokeStyle = weaponColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, weaponLength, baseAngle - Math.PI/6, baseAngle + Math.PI/6);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        // 敌人身体
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 敌人类型标识
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.behavior === 'melee' ? '⚔' : '🔫', enemy.x, enemy.y + 4);
        
        // 生命值条
        const barWidth = enemy.radius * 2;
        const barHeight = 3;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 8, barWidth, barHeight);
        
        ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
        ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.radius - 8, barWidth * healthPercent, barHeight);
    });
}

function drawBoss() {
    if (!boss) return;
    
    // BOSS身体
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // BOSS名字
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, boss.x, boss.y - boss.radius - 25);
    
    // 生命值条
    const barWidth = 60;
    const barHeight = 6;
    const healthPercent = boss.health / boss.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(boss.x - barWidth/2, boss.y - boss.radius - 15, barWidth, barHeight);
    
    ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
    ctx.fillRect(boss.x - barWidth/2, boss.y - boss.radius - 15, barWidth * healthPercent, barHeight);
    
    // 技能冷却指示器
    const indicatorRadius = boss.radius + 15;
    const indicatorWidth = 3;
    
    // 技能1冷却（地爆天星）
    if (boss.skill1Cooldown > 0) {
        const cooldownPercent = boss.skill1Cooldown / 20000;
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = indicatorWidth;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, indicatorRadius, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * cooldownPercent);
        ctx.stroke();
    }
    
    // 技能2冷却（万象天引）
    if (boss.skill2Cooldown > 0) {
        const cooldownPercent = boss.skill2Cooldown / 25000;
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = indicatorWidth;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, indicatorRadius + 5, Math.PI/2, Math.PI/2 + Math.PI * 2 * cooldownPercent);
        ctx.stroke();
    }
    
    // 技能3冷却（神罗天征）
    if (boss.skill3Cooldown > 0) {
        const cooldownPercent = boss.skill3Cooldown / 40000;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = indicatorWidth;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, indicatorRadius + 10, 0, Math.PI * 2 * cooldownPercent);
        ctx.stroke();
    }
    
    // 蓄力特效
    if (boss.isCharging) {
        const chargeTime = Date.now() - boss.chargeStart;
        const chargePercent = chargeTime / 2000; // 2秒蓄力
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 40 + chargePercent * 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // 蓄力文字
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('地爆天星蓄力中...', boss.x, boss.y - boss.radius - 40);
    }
    
    // 引力效果
    if (boss.gravityActive) {
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.gravityRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // 引力文字
        ctx.fillStyle = '#4169E1';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('万象天引', boss.x, boss.y - boss.radius - 55);
    }
    
    // 晕眩效果
    if (boss.stunActive) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // 晕眩文字
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('晕眩', boss.x, boss.y + boss.radius + 20);
    }
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 子弹尾迹
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.vx * 0.5, bullet.y - bullet.vy * 0.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        
        if (particle.type === 'damage') {
            // 绘制伤害数字
            ctx.fillStyle = particle.color;
            ctx.font = `${particle.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(particle.text, particle.x, particle.y);
        } else if (particle.type === 'slash') {
            // 绘制斩击特效
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x + particle.vx * 0.5, particle.y + particle.vy * 0.5);
            ctx.stroke();
        } else {
            // 绘制普通粒子
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const alpha = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.globalAlpha = alpha;
        
        if (powerUp.type === 'health') {
            ctx.fillStyle = '#ff6b6b';
        } else {
            ctx.fillStyle = '#4ecdc4';
        }
        
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 道具图标
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.type === 'health' ? '♥' : '⚡', powerUp.x, powerUp.y + 4);
    });
    ctx.globalAlpha = 1;
}

function drawCoins() {
    coins.forEach(coin => {
        const alpha = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 金币图标
        ctx.fillStyle = '#B8860B';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💰', coin.x, coin.y + 5);
    });
    ctx.globalAlpha = 1;
}

function drawHealthPacks() {
    healthPacks.forEach(healthPack => {
        const alpha = Math.sin(Date.now() * 0.015) * 0.3 + 0.7;
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(healthPack.x, healthPack.y, healthPack.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 回复道具图标
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❤️', healthPack.x, healthPack.y + 6);
    });
    ctx.globalAlpha = 1;
}

function drawClone() {
    const clone = player.clone;
    if (!clone) return;
    
    // 分身身体
    ctx.fillStyle = '#8A2BE2';
    ctx.beginPath();
    ctx.arc(clone.x, clone.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 分身朝向指示器
    ctx.strokeStyle = '#DDA0DD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(clone.x, clone.y);
    ctx.lineTo(
        clone.x + player.direction.x * 25,
        clone.y + player.direction.y * 25
    );
    ctx.stroke();
    
    // 分身生命值条
    const barWidth = 40;
    const barHeight = 4;
    const healthPercent = clone.health / clone.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(clone.x - barWidth/2, clone.y - player.radius - 10, barWidth, barHeight);
    
    ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
    ctx.fillRect(clone.x - barWidth/2, clone.y - player.radius - 10, barWidth * healthPercent, barHeight);
}

function drawGameUI() {
    // 当前武器信息
    const weapon = weapons[player.currentWeapon];
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, canvas.height - 80, 200, 70);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`武器: ${weapon.name}`, 15, canvas.height - 65);
    ctx.fillText(`伤害: ${weapon.damage}`, 15, canvas.height - 50);
    ctx.fillText(`弹药: ${weapon.ammo}/${weapon.maxAmmo}`, 15, canvas.height - 35);
    
    // 换弹提示
    if (player.reloadTime > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 50, 200, 30);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('换弹中...', canvas.width/2, canvas.height - 30);
    }
    
    // 弹药不足提示
    if (weapon.ammo === 0 && player.reloadTime === 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 50, 200, 30);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 R 换弹', canvas.width/2, canvas.height - 30);
    }
    
    // 弓箭蓄力提示
    if (player.isCharging && weapon.name === '弓箭') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 80, 200, 30);
        
        ctx.fillStyle = '#00FF00';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('蓄力中...', canvas.width/2, canvas.height - 60);
    }
}

// 初始化游戏
console.log('地牢射击游戏已加载完成！');
console.log('控制说明：');
console.log('- WASD 或方向键：移动');
console.log('- 鼠标：瞄准');
console.log('- 左键：射击（弓箭需要按住蓄力）');
console.log('- R：换弹');
console.log('- 1-8：切换武器');
console.log('- Q/E：切换武器');
console.log('- 全自动武器：按住左键持续射击');
console.log('- 半自动武器：点击左键射击');
console.log('Roguelike特性：');
console.log('- 击杀敌人获得金币和经验');
console.log('- 每关结束后进入商店购买道具');
console.log('- 属性永久提升，打造最强角色'); 

// 监听按键0激活作弊模式
window.addEventListener('keydown', function(e) {
    // 主键盘0: e.key === '0'，小键盘0: e.code === 'Numpad0'
    if (e.key === '0' || e.code === 'Numpad0') {
        activateCheatMode();
    }
});