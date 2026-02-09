package com.ponggame.mobile.model

data class GameState(
    val ball: Ball = Ball(),
    val paddles: Map<String, Paddle> = emptyMap(),
    val scores: Map<String, Int> = emptyMap(),
    val gameState: String = "waiting",
    val timestamp: Long = 0
)

data class Ball(
    val x: Float = 400f,
    val y: Float = 400f,
    val vx: Float = 0f,
    val vy: Float = 0f
)

data class Paddle(
    val x: Float = 0f,
    val y: Float = 0f,
    val width: Float = 0f,
    val height: Float = 0f
)

data class Player(
    val id: String,
    val position: String, // "left", "right", "top", "bottom"
    val isAI: Boolean,
    val isHost: Boolean,
    val isReady: Boolean
)

data class RoomInfo(
    val id: String,
    val playerCount: Int,
    val players: List<Player>,
    val positions: List<String>,
    val gameState: String
)
