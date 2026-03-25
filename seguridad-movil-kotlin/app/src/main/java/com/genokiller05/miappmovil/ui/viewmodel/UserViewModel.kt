package com.genokiller05.miappmovil.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.genokiller05.miappmovil.data.model.Guard
import com.genokiller05.miappmovil.data.repository.DataRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.genokiller05.miappmovil.data.remote.SupabaseClient
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.RealtimeChannel
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@HiltViewModel
class UserViewModel @Inject constructor(
    private val dataRepository: DataRepository
) : ViewModel() {

    private val _user = MutableStateFlow<Guard?>(null)
    val user: StateFlow<Guard?> = _user.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var presenceChannel: RealtimeChannel? = null

    fun login(userData: Guard) {
        _user.value = userData
        viewModelScope.launch {
            try {
                dataRepository.updateGuardStatus(userData, "En servicio")
                
                // Track online presence via WebSocket (solves issue when app is swiped away)
                val id = userData.idEmpleado.ifEmpty { userData.document_id ?: userData.id ?: "unknown" }
                val channel = SupabaseClient.client.channel("online-guards")
                channel.subscribe()
                channel.track(buildJsonObject { put("id", id); put("online", true) })
                presenceChannel = channel
            } catch (e: Exception) {
                // ignore
            }
        }
    }

    fun logout() {
        val currentUser = _user.value
        if (currentUser != null) {
            viewModelScope.launch {
                try {
                    presenceChannel?.unsubscribe()
                    presenceChannel = null
                    dataRepository.updateGuardStatus(currentUser, "Fuera de servicio")
                } catch (e: Exception) {
                    // ignore
                }
            }
        }
        _user.value = null
    }

    fun updateUser(guard: Guard) {
        _user.value = guard
    }
}
