package com.ponggame.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ponggame.mobile.game.GameViewModel
import com.ponggame.mobile.ui.screens.GameScreen
import com.ponggame.mobile.ui.screens.LobbyScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                val navController = rememberNavController()
                val viewModel: GameViewModel = viewModel()
                
                NavHost(navController = navController, startDestination = "lobby") {
                    composable("lobby") {
                        LobbyScreen(
                            viewModel = viewModel,
                            onGameStart = {
                                navController.navigate("game")
                            }
                        )
                    }
                    composable("game") {
                        GameScreen(viewModel = viewModel)
                    }
                }
            }
        }
    }
}
