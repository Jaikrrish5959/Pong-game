package com.ponggame.mobile.ui.screens

import android.view.MotionEvent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.PaintingStyle
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.unit.dp
import com.ponggame.mobile.game.GameViewModel
import com.ponggame.mobile.model.Ball
import com.ponggame.mobile.model.Paddle

// Colors
val ColorBackground = Color(0xFF0A0A1A)
val ColorArena = Color(0xFF12122A)
val ColorBorder = Color(0x33FFFFFF)
val ColorGrid = Color(0x08FFFFFF)
val ColorBall = Color.White
val ColorBallGlow = Color(0xFF00F0FF)

// Paddle Colors
val PaddleColors = mapOf(
    "left" to Color(0xFF00F0FF),
    "right" to Color(0xFFFF00AA),
    "top" to Color(0xFFFFCC00),
    "bottom" to Color(0xFF00FF88)
)

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun GameScreen(viewModel: GameViewModel) {
    val gameState by viewModel.gameState.collectAsState()
    val myPosition by viewModel.myPosition.collectAsState()
    
    // Determine input logic based on position
    // If we are 'left'/'right', we control Y axis (Up/Down).
    // If we are 'top'/'bottom', we control X axis (Left/Right).
    val isVerticalControl = myPosition == "left" || myPosition == "right"
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            // Touch Input Handler
            .pointerInteropFilter { event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE -> {
                        val width = 1000f // approximate or get real width
                        val height = 1000f 
                        
                        // Simple split screen control
                        // For vertical control (Left/Right player): Top half = UP, Bottom half = DOWN
                        // For horizontal control (Top/Bottom player): Left half = LEFT, Right half = RIGHT
                        
                        if (isVerticalControl) {
                            if (event.y < 500) viewModel.onInput("up") // Simplified detection
                            else viewModel.onInput("down")
                        } else {
                            if (event.x < 500) viewModel.onInput("left")
                            else viewModel.onInput("right")
                        }
                    }
                    MotionEvent.ACTION_UP -> {
                        viewModel.onInput("stop")
                    }
                }
                true
            }
    ) {
        // Game Canvas
        GameCanvas(gameState, Modifier.fillMaxSize())
        
        // Overlay info
        Column(modifier = Modifier.align(Alignment.TopCenter).padding(16.dp)) {
            Text("Playing as: ${myPosition ?: "Spectator"}", color = Color.Gray)
        }
    }
}

@Composable
fun GameCanvas(state: com.ponggame.mobile.model.GameState, modifier: Modifier) {
    Canvas(modifier = modifier) {
        val arenaSize = 800f
        // Calculate scale to fit screen while maintaining aspect ratio
        val scale = minOf(size.width / arenaSize, size.height / arenaSize) * 0.9f
        
        // Center the arena
        val offsetX = (size.width - arenaSize * scale) / 2
        val offsetY = (size.height - arenaSize * scale) / 2
        
        translate(left = offsetX, top = offsetY) {
            // 1. Draw Arena Background
            drawRect(
                color = ColorArena,
                size = Size(arenaSize * scale, arenaSize * scale)
            )
            
            // 2. Draw Grid
            drawGrid(arenaSize, scale)
            
            // 3. Draw Border
            drawRect(
                color = ColorBorder,
                size = Size(arenaSize * scale, arenaSize * scale),
                style = Stroke(width = 2f * scale)
            )
            
            // 4. Draw Paddles
            state.paddles.forEach { (pos, paddle) ->
                drawPaddle(paddle, PaddleColors[pos] ?: Color.White, scale)
            }
            
            // 5. Draw Ball
            drawBall(state.ball, scale)
        }
    }
}

fun DrawScope.drawGrid(arenaSize: Float, scale: Float) {
    val step = 40f
    var x = 0f
    while (x <= arenaSize) {
        drawLine(
            color = ColorGrid,
            start = Offset(x * scale, 0f),
            end = Offset(x * scale, arenaSize * scale),
            strokeWidth = 1f
        )
        x += step
    }
    var y = 0f
    while (y <= arenaSize) {
        drawLine(
            color = ColorGrid,
            start = Offset(0f, y * scale),
            end = Offset(arenaSize * scale, y * scale),
            strokeWidth = 1f
        )
        y += step
    }
}

fun DrawScope.drawPaddle(paddle: Paddle, color: Color, scale: Float) {
    // Glow Effect
    drawIntoCanvas {
        val paint = Paint().apply {
            this.color = color
            strokeWidth = 0f
            style = PaintingStyle.Fill
        }
        val frameworkPaint = paint.asFrameworkPaint()
        frameworkPaint.setShadowLayer(15f * scale, 0f, 0f, color.toArgb())
        
        it.drawRoundRect(
            left = paddle.x * scale,
            top = paddle.y * scale,
            right = (paddle.x + paddle.width) * scale,
            bottom = (paddle.y + paddle.height) * scale,
            radiusX = 5f * scale,
            radiusY = 5f * scale,
            paint = paint
        )
    }
}

fun DrawScope.drawBall(ball: Ball, scale: Float) {
    val radius = 10f * scale
    val x = ball.x * scale
    val y = ball.y * scale
    
    drawIntoCanvas {
        val paint = Paint().apply {
            color = ColorBall
            style = PaintingStyle.Fill
        }
        val frameworkPaint = paint.asFrameworkPaint()
        frameworkPaint.setShadowLayer(20f * scale, 0f, 0f, ColorBallGlow.toArgb())
        
        it.drawCircle(Offset(x, y), radius, paint)
    }
}
