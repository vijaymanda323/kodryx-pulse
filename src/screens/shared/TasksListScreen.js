import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import Badge from '../../components/Badge';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'completed', label: 'Completed' },
];

const TasksListScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  // Dropdown UI
  const [showProjSelect, setShowProjSelect] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showPrioritySelect, setShowPrioritySelect] = useState(false);

  useEffect(() => {
    fetchTasksData();
    if (user?.role === 'Founding Team' || user?.role === 'HR') {
      fetchMetaOptions();
    }
  }, []);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/tasks');
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaOptions = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/users')
      ]);
      setProjects(projRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      console.log('Meta options failed to load', err);
    }
  };

  const handleAssignTask = async () => {
    if (!title.trim() || !selectedAssignee || !dueDate.trim()) {
      Alert.alert('Validation', 'Title, Assignee, and Due Date (YYYY-MM-DD) are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/tasks', {
        title,
        project: selectedProject?._id || undefined,
        assignee: selectedAssignee._id,
        priority,
        dueDate,
        status: 'Not Started'
      });
      
      Alert.alert('Success', 'Task assigned successfully');
      setShowAssignModal(false);
      setTitle('');
      setSelectedProject(null);
      setSelectedAssignee(null);
      setPriority('Medium');
      setDueDate('');
      fetchTasksData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const matchesFilter = (t, f) => {
    if (f === 'urgent') return t.priority === 'Urgent';
    if (f === 'in-progress') return t.status === 'In Progress';
    if (f === 'blocked') return t.status === 'Blocked';
    if (f === 'completed') return t.status === 'Completed';
    return true;
  };

  const countFilter = (f) => tasks.filter(t => matchesFilter(t, f)).length;
  const filteredTasks = tasks.filter(t => matchesFilter(t, filter));

  const getPriorityColor = (p) => {
    if (p === 'Urgent') return 'danger';
    if (p === 'High') return 'warning';
    return 'neutral';
  };

  const getStatusColor = (s) => {
    if (s === 'Completed' || s === 'Submitted') return 'success';
    if (s === 'Overdue') return 'danger';
    if (s === 'Blocked') return 'warning';
    if (s === 'In Progress' || s === 'In review') return 'info';
    return 'neutral';
  };

  const canCreateTask = user?.role === 'Founding Team' || user?.role === 'HR';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Task Manager</Text>
          <Text style={styles.subtitle}>Track assignments across all projects</Text>
        </View>
        {canCreateTask && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowAssignModal(true)}>
            <Ionicons name="add" size={20} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={styles.createBtnText}>New Task</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.activeFilterChip]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.activeFilterChipText]}>
                {f.label} ({countFilter(f.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tasks List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : filteredTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="clipboard-outline" size={40} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No tasks found matching this criteria.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={styles.taskId}>{item.taskId}</Text>
                </View>
                <Badge variant={getPriorityColor(item.priority)}>{item.priority}</Badge>
              </View>

              <View style={styles.taskMetaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Assignee</Text>
                  <View style={styles.assigneeRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: item.assignee?.avatar?.bg || colors.border }]}>
                      <Text style={styles.avatarText}>{item.assignee?.avatar?.initials || item.assignee?.name?.[0] || '?'}</Text>
                    </View>
                    <Text style={styles.metaValue} numberOfLines={1}>{item.assignee?.name || 'Unassigned'}</Text>
                  </View>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Project</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>{item.project?.name || 'General'}</Text>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Due Date</Text>
                  <Text style={[styles.metaValue, item.status === 'Overdue' && { color: colors.danger }]}>
                    {item.dueDate || '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.taskFooter}>
                <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
              </View>
            </Card>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Assign Task Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign New Task</Text>
                <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <InputField
                label="Task Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Redesign Landing Page"
                icon="bookmark-outline"
              />

              {/* Project Selector */}
              <Text style={styles.inputLabel}>Project (Optional)</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowProjSelect(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedProject ? selectedProject.name : '— General / Non-Project —'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Assignee Selector */}
              <Text style={styles.inputLabel}>Assignee *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowUserSelect(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedAssignee ? selectedAssignee.name : 'Select Assignee'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Priority Selector */}
              <Text style={styles.inputLabel}>Priority *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowPrioritySelect(true)}
              >
                <Text style={styles.dropdownText}>{priority}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <InputField
                label="Due Date (YYYY-MM-DD) *"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="e.g. 2026-06-30"
                icon="calendar-outline"
              />

              <Button
                title={submitting ? 'Creating...' : 'Assign Task'}
                onPress={handleAssignTask}
                loading={submitting}
                variant="primary"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Project Options Modal */}
      <Modal visible={showProjSelect} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Project</Text>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setSelectedProject(null);
                setShowProjSelect(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>— General / Non-Project —</Text>
            </TouchableOpacity>
            {projects.map(p => (
              <TouchableOpacity
                key={p._id}
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedProject(p);
                  setShowProjSelect(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="secondary" onPress={() => setShowProjSelect(false)} />
          </View>
        </View>
      </Modal>

      {/* Assignee Options Modal */}
      <Modal visible={showUserSelect} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Assignee</Text>
            {users.map(u => (
              <TouchableOpacity
                key={u._id}
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedAssignee(u);
                  setShowUserSelect(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{u.name} ({u.role})</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="secondary" onPress={() => setShowUserSelect(false)} />
          </View>
        </View>
      </Modal>

      {/* Priority Options Modal */}
      <Modal visible={showPrioritySelect} transparent animationType="fade">
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Priority</Text>
            {['Low', 'Medium', 'High', 'Urgent'].map(p => (
              <TouchableOpacity
                key={p}
                style={styles.dropdownOption}
                onPress={() => {
                  setPriority(p);
                  setShowPrioritySelect(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{p}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cancel" variant="secondary" onPress={() => setShowPrioritySelect(false)} />
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 40,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createBtnText: {
    color: colors.text,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  filterContainer: {
    marginVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  activeFilterChipText: {
    color: colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
    marginBottom: 12,
  },
  taskTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    lineHeight: 20,
  },
  taskId: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
    marginRight: 8,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  avatarText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: '800',
  },
  metaValue: {
    color: colors.text,
    fontSize: typography.sizes.xs,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
  },
  dropdownSelector: {
    height: 52,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dropdownText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContent: {
    width: '90%',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    maxHeight: '70%',
  },
  dropdownTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  dropdownOptionText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
});

export default TasksListScreen;
