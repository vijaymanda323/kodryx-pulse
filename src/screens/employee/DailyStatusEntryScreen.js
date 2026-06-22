import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import Badge from '../../components/Badge';

const DailyStatusEntryScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  
  const [log, setLog] = useState(null);
  const [projects, setProjects] = useState([]);
  
  // New Task Form
  const [taskDesc, setTaskDesc] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoursSpent, setHoursSpent] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [progress, setProgress] = useState(50);
  const [notes, setNotes] = useState('');

  // Tomorrow Plan List
  const [tomorrow, setTomorrow] = useState([]);
  const [planTask, setPlanTask] = useState('');
  const [planProject, setPlanProject] = useState(null);

  // Dropdown Modals
  const [showProjModal, setShowProjModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeDropdownTarget, setActiveDropdownTarget] = useState('form'); // 'form' or 'plan'

  const todayStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projRes, logRes] = await Promise.all([
        api.get('/api/projects/mine').catch(() => ({ data: [] })),
        api.get(`/api/daily-status/my-status?date=${todayStr}`).catch(() => ({ data: [] }))
      ]);

      const projs = projRes.data || [];
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProject(projs[0]);
        setPlanProject(projs[0]);
      }

      const l = logRes.data.length ? logRes.data[0] : null;
      setLog(l);
      if (l && l.tomorrow) {
        setTomorrow(l.tomorrow.map(t => ({
          task: t.task,
          project: t.project?._id || t.project || '',
          projectName: t.project?.name || ''
        })));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load daily status log');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaskLog = async () => {
    if (!taskDesc.trim()) {
      Alert.alert('Required', 'Task description is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/daily-status', {
        date: todayStr,
        taskUpdate: {
          task: taskDesc,
          project: selectedProject?._id || undefined,
          hoursSpent: Number(hoursSpent) || 0,
          status: status,
          progress: status === 'Completed' ? 100 : progress,
          notes: notes
        }
      });

      Alert.alert('Success', 'Task logged successfully');
      setTaskDesc('');
      setHoursSpent('');
      setNotes('');
      setStatus('In Progress');
      setProgress(50);
      
      // Reload logs
      const logRes = await api.get(`/api/daily-status/my-status?date=${todayStr}`);
      setLog(logRes.data.length ? logRes.data[0] : null);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to log task';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const addPlanItem = () => {
    if (!planTask.trim()) return;
    setTomorrow([...tomorrow, {
      task: planTask.trim(),
      project: planProject?._id || '',
      projectName: planProject?.name || ''
    }]);
    setPlanTask('');
  };

  const removePlanItem = (idx) => {
    setTomorrow(tomorrow.filter((_, i) => i !== idx));
  };

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      await api.put('/api/daily-status/tomorrow', {
        date: todayStr,
        tomorrow: tomorrow.map(t => ({
          task: t.task,
          project: t.project || undefined
        }))
      });
      Alert.alert('Success', "Tomorrow's plan saved");
      
      // Reload logs
      const logRes = await api.get(`/api/daily-status/my-status?date=${todayStr}`);
      setLog(logRes.data.length ? logRes.data[0] : null);
    } catch (err) {
      Alert.alert('Error', 'Failed to save tomorrow plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleMarkComplete = async (idx) => {
    if (!log) return;
    const nextTasks = log.tasks.map((t, i) => {
      const serial = {
        task: t.task,
        project: t.project?._id || t.project || undefined,
        hoursSpent: t.hoursSpent || 0,
        status: t.status,
        progress: t.progress || 0,
        notes: t.notes || ''
      };
      if (i === idx) {
        serial.status = 'Completed';
        serial.progress = 100;
      }
      return serial;
    });

    try {
      await api.put(`/api/daily-status/${log._id}`, { tasks: nextTasks });
      const logRes = await api.get(`/api/daily-status/my-status?date=${todayStr}`);
      setLog(logRes.data.length ? logRes.data[0] : null);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (idx) => {
    if (!log) return;
    const nextTasks = log.tasks.filter((_, i) => i !== idx).map(t => ({
      task: t.task,
      project: t.project?._id || t.project || undefined,
      hoursSpent: t.hoursSpent || 0,
      status: t.status,
      progress: t.progress || 0,
      notes: t.notes || ''
    }));

    Alert.alert(
      'Remove Task',
      'Are you sure you want to remove this logged task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/api/daily-status/${log._id}`, { tasks: nextTasks });
              const logRes = await api.get(`/api/daily-status/my-status?date=${todayStr}`);
              setLog(logRes.data.length ? logRes.data[0] : null);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing logs...</Text>
      </SafeAreaView>
    );
  }

  const loggedTasks = log?.tasks || [];
  const totalHours = loggedTasks.reduce((s, t) => s + (t.hoursSpent || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Header Summary */}
        <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Status Log</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <Badge variant="success">Active</Badge>
      </View>

      {loggedTasks.length > 0 && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{loggedTasks.length}</Text>
              <Text style={styles.summaryLabel}>Tasks Logged</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: colors.success }]}>
                {loggedTasks.filter(t => t.status === 'Completed').length}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryVal, { color: colors.info }]}>{totalHours}h</Text>
              <Text style={styles.summaryLabel}>Hours Spent</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Log Work Form */}
      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Log Today's Work</Text>
        
        {/* Project Selector */}
        <Text style={styles.inputLabel}>Project</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => {
            setActiveDropdownTarget('form');
            setShowProjModal(true);
          }}
        >
          <Text style={styles.dropdownText}>
            {selectedProject ? selectedProject.name : '— General / Non-Project —'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <InputField
          label="Task Description *"
          value={taskDesc}
          onChangeText={setTaskDesc}
          placeholder="What task did you work on today?"
          icon="document-text-outline"
        />

        <View style={styles.row}>
          {/* Status Selection */}
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.inputLabel}>Status</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.dropdownText}>{status}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Hours spent */}
          <View style={{ flex: 1 }}>
            <InputField
              label="Hours Spent"
              value={hoursSpent}
              onChangeText={setHoursSpent}
              placeholder="e.g. 2.5"
              keyboardType="numeric"
              icon="time-outline"
            />
          </View>
        </View>

        {status !== 'Completed' && (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.inputLabel}>Progress</Text>
              <Text style={[styles.sliderVal, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <View style={styles.progressRow}>
              {[0, 25, 50, 75, 100].map(val => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setProgress(val)}
                  style={[
                    styles.progressBtn,
                    progress === val && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={[styles.progressBtnText, progress === val && { color: colors.text }]}>
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <InputField
          label="Notes / Roadblocks (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any blockers or comments..."
          icon="chatbox-ellipses-outline"
        />

        <Button
          title={submitting ? 'Submitting...' : 'Add to Daily Log'}
          onPress={handleAddTaskLog}
          loading={submitting}
          variant="primary"
        />
      </Card>

      {/* Today's logged items */}
      <Text style={styles.sectionHeader}>Today's Entries ({loggedTasks.length})</Text>
      {loggedTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="archive-outline" size={32} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No tasks logged yet for today.</Text>
        </Card>
      ) : (
        loggedTasks.map((t, idx) => (
          <Card key={idx} style={styles.taskLogCard}>
            <View style={styles.logHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.projectBadgeRow}>
                  {t.project && (
                    <View style={styles.smallProjectBadge}>
                      <Text style={styles.smallProjectBadgeText}>{t.project.name || 'Project'}</Text>
                    </View>
                  )}
                  {t.hoursSpent > 0 && <Text style={styles.logHours}>{t.hoursSpent} hrs</Text>}
                </View>
                <Text style={styles.logTaskName}>{t.task}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteTask(idx)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {t.notes ? <Text style={styles.logNotes}>Notes: {t.notes}</Text> : null}

            <View style={styles.logFooter}>
              <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'Blocked' ? 'danger' : 'info'}>
                {t.status}
              </Badge>
              {t.status !== 'Completed' && (
                <TouchableOpacity
                  style={styles.completeLink}
                  onPress={() => handleMarkComplete(idx)}
                >
                  <Ionicons name="checkmark-done" size={16} color={colors.success} />
                  <Text style={styles.completeLinkText}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}

      {/* Tomorrow's Plan */}
      <Card style={styles.planCard}>
        <View style={styles.planCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Tomorrow's Plan</Text>
            <Text style={styles.planSubtitle}>Tasks you intend to work on next</Text>
          </View>
          <TouchableOpacity style={styles.savePlanBtn} onPress={handleSavePlan} disabled={savingPlan}>
            {savingPlan ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.savePlanText}>Save Plan</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Plan Input — Project picker then task + add button */}
        <View style={styles.planProjectRow}>
          <TouchableOpacity
            style={styles.planProjectSelector}
            onPress={() => {
              setActiveDropdownTarget('plan');
              setShowProjModal(true);
            }}
          >
            <Ionicons name="folder-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.dropdownText, { fontSize: typography.sizes.sm, flex: 1 }]} numberOfLines={1}>
              {planProject ? planProject.name : '— Select Project (optional) —'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.planInputRow}>
          <TextInput
            style={styles.planInput}
            value={planTask}
            onChangeText={setPlanTask}
            placeholder="What will you do tomorrow?"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            blurOnSubmit={false}
            onSubmitEditing={addPlanItem}
          />
          <TouchableOpacity style={styles.addPlanBtn} onPress={addPlanItem}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {tomorrow.length === 0 ? (
          <View style={styles.emptyPlanContainer}>
            <Text style={styles.emptyPlanText}>Add tasks you'll tackle tomorrow.</Text>
          </View>
        ) : (
          tomorrow.map((item, idx) => (
            <View key={idx} style={styles.planItemRow}>
              <Ionicons name="ellipse" size={8} color={colors.primary} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.planItemTask}>
                  {item.projectName ? `[${item.projectName}] ` : ''}
                  {item.task}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removePlanItem(idx)}>
                <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      {/* Project Selector Modal */}
      <Modal visible={showProjModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  if (activeDropdownTarget === 'form') {
                    setSelectedProject(null);
                  } else {
                    setPlanProject(null);
                  }
                  setShowProjModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>— General / Non-Project —</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity
                  key={p._id}
                  style={styles.modalOption}
                  onPress={() => {
                    if (activeDropdownTarget === 'form') {
                      setSelectedProject(p);
                    } else {
                      setPlanProject(p);
                    }
                    setShowProjModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Selector Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {['In Progress', 'Completed', 'Blocked', 'Not Started'].map(s => (
              <TouchableOpacity
                key={s}
                style={styles.modalOption}
                onPress={() => {
                  setStatus(s);
                  setShowStatusModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 0,
    marginBottom: 16,
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
  summaryCard: {
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryVal: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  formCard: {
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  progressBtnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  sectionHeader: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 12,
    marginTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  taskLogCard: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  smallProjectBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  smallProjectBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  logHours: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  logTaskName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 6,
  },
  logNotes: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: colors.cardBgSecondary,
    padding: 8,
    borderRadius: 6,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeLinkText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    marginLeft: 4,
  },
  planCard: {
    marginTop: 20,
    marginBottom: 20,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  savePlanBtn: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  savePlanText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  planProjectRow: {
    marginBottom: 10,
  },
  planProjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  planInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  planInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.text,
    fontSize: typography.sizes.sm,
    marginRight: 8,
  },
  addPlanBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPlanContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  emptyPlanText: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planItemTask: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '65%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },
});

export default DailyStatusEntryScreen;
