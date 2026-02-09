package com.ponggame.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ponggame.mobile.game.GameViewModel
import com.ponggame.mobile.model.Player

@Composable
fun LobbyScreen(viewModel: GameViewModel, onGameStart: () -> Unit) {
    val currentRoom by viewModel.currentRoom.collectAsState()
    val gameState by viewModel.gameState.collectAsState()

    // Navigate to game if it starts
    LaunchedEffect(gameState.gameState) {
        if (gameState.gameState == "playing") {
            onGameStart()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A1A)),
        contentAlignment = Alignment.Center
    ) {
        if (currentRoom == null) {
            // Main Menu
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "NEON PONG",
                    fontSize = 48.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF00F0FF)
                )
                
                Button(onClick = { viewModel.quickPlay() }) {
                    Text("Quick Play (vs AI)")
                }
                
                var roomInput by remember { mutableStateOf("") }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextField(
                        value = roomInput,
                        onValueChange = { roomInput = it },
                        placeholder = { Text("Room ID") },
                        modifier = Modifier.width(150.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = { viewModel.joinRoom(roomInput) }) {
                        Text("Join")
                    }
                }
            }
        } else {
            // Room Lobby
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(32.dp)
            ) {
                Text(
                    text = "Room: ${currentRoom!!.id}",
                    fontSize = 32.sp,
                    color = Color.White
                )
                
                Text("Players:", color = Color.Gray)
                
                currentRoom!!.players.forEach { player ->
                    PlayerRow(player)
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                
                val myId = viewModel.myPosition.value // Actually need ID, but simplified
                // Find my player object to check ready state would be better
                
                Button(onClick = { viewModel.toggleReady() }) {
                    Text("Toggle Ready")
                }
            }
        }
    }
}

@Composable
fun PlayerRow(player: Player) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .background(Color(0xFF12122A))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "${player.position} ${if (player.isAI) "(AI)" else ""}",
            color = if(player.isHost) Color(0xFFFFCC00) else Color.White
        )
        Text(
            text = if (player.isReady) "READY" else "WAITING",
            color = if (player.isReady) Color.Green else Color.Red
        )
    }
}
