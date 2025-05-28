import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications, NotificationBadge } from '@/context/notification-context';
import Feather from '@expo/vector-icons/Feather';

export default function HomePage() {
  const {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    addNotification,
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    unreadCount
  } = useNotifications();

  const [showNotificationList, setShowNotificationList] = useState(false);

  // Test toast notifications
  const testToasts = () => {
    // Basic toasts
    showSuccess('Success!', 'Your action was completed successfully.');
    
    setTimeout(() => {
      showError('Error!', 'Something went wrong. Please try again.');
    }, 1500);
    
    setTimeout(() => {
      showWarning('Warning!', 'This action might have consequences.');
    }, 3000);
    
    setTimeout(() => {
      showInfo('Information', 'Here is some useful information for you.');
    }, 4500);
  };

  // Test toast with action
  const testToastWithAction = () => {
    showToast({
      type: 'success',
      title: 'Item Added',
      message: 'Your item was added to the cart',
      action: {
        label: 'View Cart',
        onPress: () => showInfo('Action Pressed', 'You clicked the action button!')
      }
    });
  };

  // Test persistent toast
  const testPersistentToast = () => {
    showToast({
      type: 'info',
      title: 'Persistent Notification',
      message: 'This notification will stay until dismissed',
      persistent: true
    });
  };

  // Test in-app notification
  const testInAppNotification = () => {
    addNotification({
      type: 'info',
      title: 'New Message',
      message: 'You received a new message from a friend',
      action: {
        label: 'View',
        onPress: () => showInfo('Notification Action', 'You clicked on a notification')
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notification Tester</Text>
        <Pressable 
          style={styles.notificationButton}
          onPress={() => setShowNotificationList(!showNotificationList)}
        >
          <Feather name="bell" size={24} color="#1F2937" />
          {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Toast Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toast Notifications</Text>
          
          <Pressable style={styles.button} onPress={testToasts}>
            <Text style={styles.buttonText}>Test All Toast Types</Text>
          </Pressable>
          
          <Pressable style={styles.button} onPress={testToastWithAction}>
            <Text style={styles.buttonText}>Toast with Action</Text>
          </Pressable>
          
          <Pressable style={styles.button} onPress={testPersistentToast}>
            <Text style={styles.buttonText}>Persistent Toast</Text>
          </Pressable>
        </View>

        {/* Individual Toast Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Toast Types</Text>
          
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.smallButton, { backgroundColor: '#10B981' }]} 
              onPress={() => showSuccess('Success!', 'Operation completed successfully')}
            >
              <Feather name="check-circle" size={20} color="white" />
              <Text style={styles.smallButtonText}>Success</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.smallButton, { backgroundColor: '#EF4444' }]} 
              onPress={() => showError('Error!', 'Something went wrong')}
            >
              <Feather name="x-circle" size={20} color="white" />
              <Text style={styles.smallButtonText}>Error</Text>
            </Pressable>
          </View>
          
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.smallButton, { backgroundColor: '#F59E0B' }]} 
              onPress={() => showWarning('Warning!', 'Proceed with caution')}
            >
              <Feather name="alert-triangle" size={20} color="white" />
              <Text style={styles.smallButtonText}>Warning</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.smallButton, { backgroundColor: '#3B82F6' }]} 
              onPress={() => showInfo('Info', 'Here is some information')}
            >
              <Feather name="info" size={20} color="white" />
              <Text style={styles.smallButtonText}>Info</Text>
            </Pressable>
          </View>
        </View>

        {/* In-App Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In-App Notifications</Text>
          
          <Pressable style={styles.button} onPress={testInAppNotification}>
            <Text style={styles.buttonText}>Add In-App Notification</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.button, { backgroundColor: '#6B7280' }]} 
            onPress={markAllAsRead}
          >
            <Text style={styles.buttonText}>Mark All as Read</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.button, { backgroundColor: '#EF4444' }]} 
            onPress={clearAllNotifications}
          >
            <Text style={styles.buttonText}>Clear All Notifications</Text>
          </Pressable>
        </View>

        {/* Advanced Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Tests</Text>
          
          <Pressable 
            style={styles.button} 
            onPress={() => {
              // Test multiple notifications in sequence
              for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                  showToast({
                    type: i % 2 === 0 ? 'success' : 'info',
                    title: `Notification ${i}`,
                    message: `This is test notification number ${i}`
                  });
                }, i * 800);
              }
            }}
          >
            <Text style={styles.buttonText}>Test Multiple Toasts</Text>
          </Pressable>
          
          <Pressable 
            style={styles.button} 
            onPress={() => {
              // Add multiple in-app notifications
              const types: ('success' | 'error' | 'warning' | 'info')[] = ['success', 'error', 'warning', 'info'];
              for (let i = 0; i < 4; i++) {
                addNotification({
                  type: types[i],
                  title: `${types[i].charAt(0).toUpperCase() + types[i].slice(1)} Notification`,
                  message: `This is a test ${types[i]} notification`
                });
              }
            }}
          >
            <Text style={styles.buttonText}>Add Multiple Notifications</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Notification List Overlay */}
      {showNotificationList && (
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationContainer}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotificationList(false)}>
                <Feather name="x" size={24} color="#1F2937" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.notificationList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="inbox" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map(notification => (
                  <Pressable 
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => {
                      markAsRead(notification.id);
                      if (notification.action) {
                        notification.action.onPress();
                      }
                    }}
                  >
                    <View style={styles.notificationIcon}>
                      {notification.type === 'success' && <Feather name="check-circle" size={20} color="#10B981" />}
                      {notification.type === 'error' && <Feather name="x-circle" size={20} color="#EF4444" />}
                      {notification.type === 'warning' && <Feather name="alert-triangle" size={20} color="#F59E0B" />}
                      {notification.type === 'info' && <Feather name="info" size={20} color="#3B82F6" />}
                      {notification.type === 'default' && <Feather name="bell" size={20} color="#6B7280" />}
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationItemTitle}>{notification.title}</Text>
                      <Text style={styles.notificationItemMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    
                    <Pressable 
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  smallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  smallButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  notificationContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationList: {
    maxHeight: 500,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadNotification: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});