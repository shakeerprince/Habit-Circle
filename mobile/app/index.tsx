// ═══════════════════════════════════════════════════════════════
//  Rithmic — Onboarding Screen
//  3-page carousel with particles animation
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue, useAnimatedStyle, withTiming, withRepeat,
    withSequence, withDelay, FadeInUp, FadeInDown, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing } from '../lib/theme';

const { width } = Dimensions.get('window');

const pages = [
    { icon: '🎯', title: 'Track Your Habits', desc: 'Build powerful routines with smart tracking, streaks, and daily goals that keep you motivated.' },
    { icon: '🏆', title: 'Join Challenges', desc: 'Compete with friends and the community in fun habit challenges. Climb leaderboards together!' },
    { icon: '🚀', title: 'Grow Together', desc: 'Share wins, get inspired, and earn badges as you build the best version of yourself.' },
];

// Particle component
function Particle({ delay, size }: { delay: number; size: number }) {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(-300, { duration: 8000 }),
                withTiming(0, { duration: 0 }),
            ), -1
        ));
        opacity.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withTiming(0.1, { duration: 4000 }),
                withTiming(0, { duration: 2000 }),
            ), -1
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.accent,
        }, style]} />
    );
}

export default function OnboardingScreen() {
    const [currentPage, setCurrentPage] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const router = useRouter();
    const scrollX = useSharedValue(0);

    const goLogin = () => router.push('/login');

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
            setCurrentPage(viewableItems[0].index);
        }
    }).current;

    const goNext = () => {
        if (currentPage < 2) {
            flatListRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
        } else {
            goLogin();
        }
    };

    return (
        <View style={styles.container}>
            {/* Background particles */}
            <View style={styles.particles}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View key={i} style={{ position: 'absolute', left: `${12 + i * 11}%`, bottom: `${4 + (i % 3) * 6}%` }}>
                        <Particle delay={i * 1200} size={3 + (i % 3) * 2} />
                    </View>
                ))}
            </View>

            {/* Logo */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text style={styles.logo}>Rithmic</Text>
            </Animated.View>

            {/* Carousel */}
            <FlatList
                ref={flatListRef}
                data={pages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                renderItem={({ item, index }) => (
                    <View style={[styles.pageContainer, { width }]}>
                        <Animated.View entering={FadeInUp.delay(300).springify()}>
                            <Text style={styles.icon}>{item.icon}</Text>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.desc}>{item.desc}</Text>
                        </Animated.View>
                    </View>
                )}
                keyExtractor={(_, i) => i.toString()}
            />

            {/* Dots */}
            <View style={styles.dots}>
                {pages.map((_, i) => (
                    <Pressable key={i} onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}>
                        <View style={[styles.dot, i === currentPage && styles.dotActive]} />
                    </Pressable>
                ))}
            </View>

            {/* Actions */}
            <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.actions}>
                {currentPage < 2 ? (
                    <>
                        <Pressable style={styles.btnOutline} onPress={goLogin}>
                            <Text style={styles.btnOutlineText}>Skip</Text>
                        </Pressable>
                        <Pressable style={[styles.btnPrimary, { flex: 2 }]} onPress={goNext}>
                            <Text style={styles.btnPrimaryText}>Next →</Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable style={[styles.btnPrimary, { flex: 1 }]} onPress={goLogin}>
                        <Text style={styles.btnPrimaryText}>Get Started 🚀</Text>
                    </Pressable>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        paddingTop: 80,
        paddingBottom: 50,
    },
    particles: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    logo: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.accent,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 20,
    },
    pageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    icon: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    desc: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textMuted,
    },
    dotActive: {
        backgroundColor: colors.accent,
        width: 24,
        borderRadius: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
    },
    btnOutline: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
    },
    btnOutlineText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    btnPrimary: {
        paddingVertical: 14,
        borderRadius: radius.full,
        backgroundColor: colors.accent,
        alignItems: 'center',
        ...shadows.accentBtn,
    },
    btnPrimaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.bgPrimary,
    },
});
