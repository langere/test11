from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # 应用CORS，允许所有来源的跨域请求，生产环境可按需配置更精细规则

# 数据库连接和创建表（若不存在）
def create_table():
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        total_games INTEGER,
        successful_games INTEGER
    );
    """
    cursor.execute(create_table_sql)
    conn.commit()
    conn.close()

create_table()

# 获取所有玩家数据的路由
@app.route('http://127.0.0.1:5000/api/players', methods=['GET'])
def get_players():
    conn = sqlite3.connect('game.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players")
    players = cursor.fetchall()
    conn.close()
    # 转换为字典列表形式，方便前端处理和展示
    players_data = []
    for player in players:
        player_dict = {
            'id': player[0],
            'nickname': player[1],
            'total_games': player[2],
            'successful_games': player[3]
        }
        players_data.append(player_dict)
    return jsonify(players_data)

# 保存玩家数据的路由（假设前端传来包含昵称、总游戏次数、成功游戏次数等信息的数据）
@app.route('http://127.0.0.1:5000/api/players', methods=['POST'])
def save_player():
    try:
        data = request.get_json()
        nickname = data.get('nickname')
        total_games = data.get('total_games')
        successful_games = data.get('successful_games')
        conn = sqlite3.connect('game.db')
        cursor = conn.cursor()
        insert_sql = "INSERT INTO players (nickname, total_games, successful_games) VALUES (?,?,?)"
        cursor.execute(insert_sql, (nickname, total_games, successful_games))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Player data saved successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # 返回错误信息及500状态码，表示服务器内部错误

if __name__ == '__main__':
    app.run(debug=True)