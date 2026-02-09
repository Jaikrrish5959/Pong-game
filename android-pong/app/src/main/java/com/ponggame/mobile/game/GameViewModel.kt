package com.ponggame.mobile.game

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ponggame.mobile.model.GameState
import com.ponggame.mobile.network.SocketManager
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class GameViewModel : ViewModel() {

    private val socketManager = SocketManager

    val connectionState = socketManager.connectionState
    val gameState: StateFlow<GameState> = socketManager.gameState
    val currentRoom = socketManager.currentRoom
    
    // Helper to know which paddle is ours
    val myPosition: StateFlow<String?> = socketManager.playerPosition

    init {
        // Auto-connect on init (or you can do this in MainActivity)
        socketManager.connect()
    }

    fun quickPlay() {
        socketManager.quickPlay()
    }
    
    fun joinRoom(roomId: String) {
        socketManager.joinRoom(roomId)
    }

    fun onInput(direction: String) {
        // Direction: "up", "down", "left", "right", "stop"
        socketManager.sendInput(direction)
    }
    
    fun toggleReady() {
        socketManager.toggleReady()
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.disconnect()
    }
}
