package com.genokiller05.miappmovil.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.genokiller05.miappmovil.data.model.AppNotification
import com.genokiller05.miappmovil.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private var currentUserId: String? = null
    private var listenJob: Job? = null

    fun startListening(userId: String) {
        if (currentUserId == userId) return
        
        currentUserId = userId
        _isLoading.value = true
        
        viewModelScope.launch {
            // Subscribe to realtime channel
            notificationRepository.subscribeChannel(userId)
            
            // Fetch existing notifications
            val pastNotifs = notificationRepository.fetchNotifications(userId)
            _notifications.value = pastNotifs
            
            _isLoading.value = false
            
            listenJob?.cancel()
            
            listenJob = launch {
                notificationRepository.listenForNewNotifications(userId).collect { newNotif ->
                    val currentList = _notifications.value.toMutableList()
                    if (currentList.none { it.id == newNotif.id }) {
                        currentList.add(0, newNotif) // Add new notification to top
                        _notifications.value = currentList
                    }
                }
            }
        }
    }

    fun acknowledge(notificationId: String) {
        viewModelScope.launch {
            notificationRepository.acknowledge(notificationId)
            
            // Update local state optimistic
            val updatedList = _notifications.value.map {
                if (it.id == notificationId) it.copy(status = "acknowledged") else it
            }
            _notifications.value = updatedList
        }
    }

    fun acknowledgeAll(userId: String) {
        viewModelScope.launch {
            notificationRepository.acknowledgeAll(userId)
            
            // Update local state optimistic
            val updatedList = _notifications.value.map {
                if (it.status == "pending") it.copy(status = "acknowledged") else it
            }
            _notifications.value = updatedList
        }
    }

    override fun onCleared() {
        super.onCleared()
        currentUserId?.let { userId ->
            // Note: Cannot safely launch in viewModelScope here if ViewModel is cleared,
            // but unsubscribeChannel is handled in repository realistically if the app dies.
            // Normally realtime subscriptions die with the app.
        }
    }
}
