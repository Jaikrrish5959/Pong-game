package com.ponggame.mobile.network

import android.util.Log
import com.google.gson.Gson
import com.ponggame.mobile.model.GameState
import com.ponggame.mobile.model.RoomInfo
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.net.URISyntaxException

object SocketManager {
    // 10.0.2.2 is localhost for Android Emulator
    // For real device, use your PC's LAN IP (e.g., http://192.168.1.5:3000)
    private const val BASE_URL = "http://10.0.2.2:3000"
    
    private var socket: Socket? = null
    private val gson = Gson()

    private val _connectionState = MutableStateFlow(false)
    val connectionState = _connectionState.asStateFlow()

    private val _gameState = MutableStateFlow(GameState())
    val gameState = _gameState.asStateFlow()

    private val _currentRoom = MutableStateFlow<RoomInfo?>(null)
    val currentRoom = _currentRoom.asStateFlow()
    
    private val _playerId = MutableStateFlow<String?>(null)
    val playerId = _playerId.asStateFlow()
    
    private val _playerPosition = MutableStateFlow<String?>(null)
    val playerPosition = _playerPosition.asStateFlow()

    fun connect(url: String = BASE_URL) {
        try {
            if (socket?.connected() == true) return

            val options = IO.Options().apply {
                transports = arrayOf("websocket")
            }
            socket = IO.socket(url, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Connected")
                _connectionState.value = true
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "Disconnected")
                _connectionState.value = false
                _currentRoom.value = null
            }
            
            socket?.on("roomJoined") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    val roomInfo = parseRoomInfo(data)
                    _currentRoom.value = roomInfo
                    _playerId.value = data.optString("playerId")
                    _playerPosition.value = data.optString("position")
                }
            }
            
            socket?.on("roomCreated") { args ->
                 if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    val roomInfo = parseRoomInfo(data)
                    _currentRoom.value = roomInfo
                    _playerId.value = data.optString("playerId")
                    _playerPosition.value = data.optString("position")
                }
            }

            // Multiplexed game messages
            socket?.on("gameMessage") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    val type = data.optString("type")
                    
                    when (type) {
                        "state" -> {
                            // High frequency update
                            val state = gson.fromJson(data.toString(), GameState::class.java)
                            _gameState.value = state
                        }
                        "playerJoined", "playerLeft", "readyUpdate" -> {
                            // Update room info if we have one
                            // Ideally, we'd reconstruct the full RoomInfo, but the server
                            // sends partial updates sometimes. For now, let's assume 'players' array is sent.
                             val playersJson = data.optJSONArray("players")
                             if (playersJson != null && _currentRoom.value != null) {
                                 // Re-fetch logic or manual update would be better, 
                                 // but for MVP we might need to parse 'players' list again.
                                 // Simplified:
                                 // _currentRoom.value = _currentRoom.value?.copy(...) 
                             }
                        }
                        "gameEnded" -> {
                             // Handle game over
                        }
                    }
                }
            }

            socket?.connect()

        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }
    
    private fun parseRoomInfo(json: JSONObject): RoomInfo {
        // This is a simplification. You might need a more robust parser 
        // depending on exactly what 'roomJoined' sends vs 'roomInfo'.
        val id = json.optString("roomId")
        // Note: The server sends 'players' as an array in roomJoined
        val playersJson = json.optJSONArray("players")
        val players = ArrayList<com.ponggame.mobile.model.Player>()
        
        if (playersJson != null) {
             for (i in 0 until playersJson.length()) {
                 val p = playersJson.getJSONObject(i)
                 players.add(gson.fromJson(p.toString(), com.ponggame.mobile.model.Player::class.java))
             }
        }
        
        return RoomInfo(
            id = id,
            playerCount = players.size, // Approximation
            players = players,
            positions = listOf(), // Parse positions if needed
            gameState = "waiting"
        )
    }

    fun quickPlay() {
        val config = JSONObject()
        config.put("mode", "human_vs_ai")
        config.put("playerCount", 2)
        socket?.emit("quickPlay", config)
    }
    
    fun joinRoom(roomId: String) {
        socket?.emit("joinRoom", roomId)
    }

    fun sendInput(direction: String) {
        val data = JSONObject()
        data.put("direction", direction)
        socket?.emit("input", data)
    }
    
    fun toggleReady() {
        socket?.emit("toggleReady")
    }
    
    fun disconnect() {
        socket?.disconnect()
    }
}
