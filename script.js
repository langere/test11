// 获取页面元素
const startNewGameBtn = document.getElementById('start-new-game-btn');
const loadGameBtn = document.getElementById('load-game-btn');
const nicknameInput = document.getElementById('nickname-input');
const mainMenu = document.getElementById('main-menu');
const animationContainer = document.getElementById('animation-container');
const messageContainer = document.getElementById('message-container');
const backgroundMusic = document.getElementById('background-music');
const currentSceneImg = document.getElementById('current-scene-img');
const virtualKeyboard = document.getElementById('virtual-keyboard');
const restartButtonsContainer = document.getElementById('restart-buttons-container'); 

const playerDataKey = "playerData";
let successRateModifier = 0;

// 获取玩家数据（从本地存储获取，同时后续会结合后端获取完整数据展示）
function getPlayerData() {
    const data = localStorage.getItem(playerDataKey);
    return data? JSON.parse(data) : null;
}

// 保存玩家数据到本地存储（同时会发送到后端保存）
function savePlayerData(playerData) {
    localStorage.setItem(playerDataKey, JSON.stringify(playerData));
    // 发送POST请求到后端保存数据
    sendPlayerDataToBackend(playerData);
}

// 初始化玩家数据
function initializePlayerData(nickname) {
    return {
        id: Date.now(),
        nickname: nickname,
        totalGames: 0,
        successfulGames: 0,
    };
}

// 更新玩家数据，并发送到后端保存
function updatePlayerData(isSuccessful) {
    const playerData = getPlayerData();
    if (playerData) {
        playerData.totalGames += 1;
        if (isSuccessful) {
            playerData.successfulGames += 1;
        }
        savePlayerData(playerData);
    }
}

// 发送玩家数据到后端保存的函数（假设后端有对应的 /api/players 接口接收POST请求保存数据）
async function sendPlayerDataToBackend(playerData) {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error("发送玩家数据到后端失败:", error);
    }
}

// 加载 data.txt 文件中的游戏描述数据（与之前逻辑一致）
async function loadData() {
    try {
        const response = await fetch('data.txt');
        const data = await response.text();
        const sceneData = data.split('\n').reduce((acc, line) => {
            const [key, value] = line.split(': ');
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return sceneData;
    } catch (error) {
        console.error("加载 data.txt 文件失败：", error);
        return {};
    }
}

// 显示数据中的描述信息并加载对应的图片（与之前逻辑一致）
async function showData(key) {
    const data = await loadData();
    if (data[key + '描述']) {
        showMessage(data[key + '描述']);
    }
    loadSceneImage(key);
}

// 显示消息函数，逐条显示并在每条显示后消失（与之前逻辑一致）
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.opacity = 0;
    messageContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.style.transition = 'opacity 1s';
        messageElement.style.opacity = 1;
    }, 0);

    setTimeout(() => {
        messageElement.style.opacity = 0;
        setTimeout(() => messageElement.remove(), 0);
    }, 3500);
}

// 加载场景图片
async function loadSceneImage(scene) {
    const data = await loadData();
    const imagePath = data[scene];
    if (imagePath) {
        currentSceneImg.src = imagePath;
    }
}

// 启动背景音乐
function playBackgroundMusic() {
    backgroundMusic.loop = true;
    backgroundMusic.play();
}

// 停止背景音乐
function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// 启动游戏（与之前逻辑一致）
function startGame() {
    mainMenu.style.display = 'none';
    animationContainer.style.display = 'flex';
    messageContainer.innerHTML = '';
    messageContainer.style.display = 'block';
    restartButtonsContainer.style.display = 'none';

    playBackgroundMusic();
    animateTreasureHunt();
}

// 主菜单按钮点击事件
startNewGameBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert("请输入昵称！");
        return;
    }
    const playerData = initializePlayerData(nickname);
    savePlayerData(playerData);
    startGame();
});

loadGameBtn.addEventListener('click', () => {
    const playerData = getPlayerData();
    if (playerData) {
        alert(`欢迎回来，${playerData.nickname}！你已玩了 ${playerData.totalGames} 次，成功了 ${playerData.successfulGames} 次。`);
        startGame();
    } else {
        alert("没有找到存档，请先开始新游戏！");
    }
});

// 游戏动画流程（与之前逻辑一致）
async function animateTreasureHunt() {
    await showData('图书馆');
    await wait(3500);

    await showData('神庙');
    await showMessage("你来到了神庙，选择你的行动：");
    createVirtualButtons();
}

// 创建虚拟按钮供玩家选择行动（与之前逻辑一致）
function createVirtualButtons() {
    const button1 = document.createElement('button');
    button1.textContent = "巡视神庙";
    button1.addEventListener('click', () => handlePatrolChoice());
    virtualKeyboard.appendChild(button1);

    const button2 = document.createElement('button');
    button2.textContent = "敲开地面";
    button2.addEventListener('click', () => handleDigChoice());
    virtualKeyboard.appendChild(button2);
}

// 处理巡视神庙的选择（与之前逻辑一致）
async function handlePatrolChoice() {
    hideButtons();
    await showData('巡视神庙');
    await showMessage("你选择了巡视神庙，正在搜寻线索...");
    await wait(3500);

    successRateModifier = (Math.random() * 0.2) - 0.1;

    if (successRateModifier > 0) {
        showMessage(`恭喜！我们找到了一些线索，这让我们离宝藏更近了，经过计算，这条线索让我们 ${Math.round(successRateModifier * 100)}%的成功率`);
    } else {
        showMessage(`警告！我们受到神庙陷阱的伤害，经过计算，这次受伤让我的找的宝藏的概率 ${Math.round(successRateModifier * 100)}%`);
    }

    await wait(3500);
    startTempleSearch();
}

// 处理敲开地面的选择（与之前逻辑一致）
async function handleDigChoice() {
    hideButtons();
    await showData('敲开地面');
    await showMessage("你选择了敲开地面，希望能有所收获...");
    await wait(3500);

    successRateModifier = (Math.random() * 0.8) - 0.4;

    if (successRateModifier > 0) {
        showMessage(`恭喜！这下面就是宝藏，经过计算，在守卫来之前我们${Math.round(successRateModifier * 100)}%的成功率`);
    } else {
        showMessage(`警告！这动静太大了，守卫很有可能会出现，经过计算，找到宝藏的概率 ${Math.round(successRateModifier * 100)}%`);
    }

    await wait(3500);
    startTempleSearch();
}

// 隐藏选择按钮（与之前逻辑一致）
function hideButtons() {
    virtualKeyboard.innerHTML = '';
}

// 开始搜索神庙，判断是否成功（与之前逻辑一致）
async function startTempleSearch() {
    const baseSuccessRate = 0.5;
    const adjustedSuccessRate = baseSuccessRate + successRateModifier;

    if (Math.random() < adjustedSuccessRate) {
        showMessage("恭喜！你成功找到了神秘的宝藏！");
        currentSceneImg.src = 'temple_treasure_box.jpg';
        updatePlayerData(true);
    } else {
        showMessage("糟糕！你遇到了神庙守卫，被守卫击败！");
        currentSceneImg.src = 'temple_guard.jpg';
        updatePlayerData(false);
    }
    await wait(2000);
    showRestartButtons();
}

// 等待指定毫秒数的函数（与之前逻辑一致）
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// 重新开始游戏（与之前逻辑一致）
function restartGame() {
    successRateModifier = 0;
    currentSceneImg.src = '';
    messageContainer.innerHTML = '';
    startGame();
}

// 获取玩家数据并展示的函数（新增，从后端获取所有玩家数据并展示）
async function displayPlayerData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/players');
        const playersData = await response.json();
        const dataDisplayElement = document.createElement('div');
        playersData.forEach(player => {
            const playerInfo = `昵称: ${player.nickname}, 总游戏次数: ${player.totalGames}, 成功次数: ${player.successfulGames}<br>`;
            dataDisplayElement.innerHTML += playerInfo;
        });
        document.body.appendChild(dataDisplayElement);
    } catch (error) {
        console.error("获取玩家数据失败:", error);
    }
}

// 在页面加载完成时调用获取并展示玩家数据的函数
window.onload = function () {
    displayPlayerData();
};
// 显示重新开始游戏的按钮（与之前创建按钮、添加事件监听等逻辑结合起来实现完整功能）
function showRestartButtons() {
    const restartButtonsContainer = document.getElementById('restart-buttons-container');
    restartButtonsContainer.style.display = 'flex';

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', restartGame);

    const mainMenuBtn = document.getElementById('main-menu-btn');
    mainMenuBtn.addEventListener('click', goToMainMenu);
}
// 返回主菜单
function goToMainMenu() {
    mainMenu.style.display = 'flex'; // 显示主菜单
    animationContainer.style.display = 'none'; // 隐藏游戏内容
    restartButtonsContainer.style.display = 'none'; // 隐藏“再来一次”和“返回主菜单”按钮
}

// 添加“再来一次”和“返回主菜单”的按钮
const restartButtonsHTML = `
    <button id="restart-btn">再来一次</button>
    <button id="main-menu-btn">返回主菜单</button>
`;

//document.getElementById('restart-buttons-container').innerHTML = restartButtonsHTML;

//document.getElementById('restart-btn').addEventListener('click', restartGame);
//document.getElementById('main-menu-btn').addEventListener('click', goToMainMenu);