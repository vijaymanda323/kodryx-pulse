import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme/colors';
import api from '../../services/api';
import Card from '../../components/Card';

const { width } = Dimensions.get('window');

const TeamScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [leavesByUser, setLeavesByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = async () => {
    try {
      const [u, l] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/leaves').catch(() => ({ data: [] })),
      ]);
      // filter to show employees and interns
      const teamList = (u.data || []).filter((m) => m.role === 'Employee' || m.role === 'Intern');
      setMembers(teamList);
      
      const grouped = {};
      (l.data || []).forEach((lv) => {
        const eid = lv.employee?._id || lv.employee;
        (grouped[eid] = grouped[eid] || []).push(lv);
      });
      setLeavesByUser(grouped);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeam();
  };

  const getMemberStatus = (mid) => {
    const userLeaves = leavesByUser[mid] || [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayLeave = userLeaves.find(l => l.status === 'Approved' && l.startDate <= todayStr && l.endDate >= todayStr);
    
    if (todayLeave) {
      return todayLeave.type === 'Work from Home' ? { label: 'WFH', bg: colors.infoBg, text: colors.infoText } : { label: 'Leave', bg: colors.dangerBg, text: colors.dangerText };
    }
    return { label: 'Present', bg: colors.successBg, text: colors.successText };
  };

  const renderMemberCard = ({ item }) => {
    const status = getMemberStatus(item._id);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EmployeeWorkflow', { id: item._id })}
        activeOpacity={0.9}
      >
        <Card style={styles.memberCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: item.avatar?.bg || colors.brandLight }]}>
              <Text style={[styles.avatarText, { color: item.avatar?.color || colors.brandDark }]}>
                {item.avatar?.initials || item.name?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>

          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberDesignation}>{item.designation || 'Team Member'}</Text>
          <Text style={styles.memberDept}>{item.department || 'General'}</Text>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
            </View>
            {item.workStats?.performance && (
              <View style={styles.perfBadge}>
                <Text style={styles.perfText}>{item.workStats.performance}%</Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Team Directory</Text>
          <Text style={styles.headerSub}>{members.length} active members</Text>
        </View>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        renderItem={renderMemberCard}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.brand]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 12,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  memberCard: {
    width: (width - 36) / 2,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  memberName: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  memberDesignation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberDept: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  emailText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  perfBadge: {
    backgroundColor: colors.successBg,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  perfText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.successText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: width - 24,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});

export default TeamScreen;
