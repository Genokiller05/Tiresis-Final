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

@HiltViewModel
class UserViewModel @Inject constructor(
    private val dataRepository: DataRepository
) : ViewModel() {

    private val _user = MutableStateFlow<Guard?>(null)
    val user: StateFlow<Guard?> = _user.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun login(userData: Guard) {
        _user.value = userData
        viewModelScope.launch {
            try {
                val userId = userData.idEmpleado.ifEmpty { userData.document_id ?: userData.id ?: "" }
                if (userId.isNotEmpty()) {
                    dataRepository.updateGuardStatus(userId, "En servicio")
                }
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
                    val userId = currentUser.idEmpleado.ifEmpty {
                        currentUser.document_id ?: currentUser.id ?: ""
                    }
                    if (userId.isNotEmpty()) {
                        dataRepository.updateGuardStatus(userId, "Fuera de servicio")
                    }
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
