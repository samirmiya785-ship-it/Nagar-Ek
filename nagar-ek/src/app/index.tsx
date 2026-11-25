import { AuthStoreInterface, useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/stores/themeStore';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from "react";
import { Image, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Index() {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore() as AuthStoreInterface;

  const handleLogin = async () => {
    await login(email, password, router);
  }

  return (
    <View style={[styles.body, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <View style={[styles.logoContainer, { backgroundColor: t.isDark ? '#0d2a18' : '#00ff2a29' }]}>
        <View style={{ height: Platform.OS === 'ios' ? 60 : 40 }} />
        <Image
          source={require("../../assets/images/logo/nagarek-logo-png.png")}
          style={styles.logo}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 70 }}>
          <View style={[styles.horizontalRule, { backgroundColor: t.isDark ? '#81c784' : '#0e6c00' }]} />
          <Text style={[styles.logoSubtitle, { color: t.isDark ? '#81c784' : 'rgb(0, 131, 13)' }]}>Your Digital City Creation</Text>
          <View style={[styles.horizontalRule, { backgroundColor: t.isDark ? '#81c784' : '#0e6c00' }]} />
        </View>
      </View>
      <View style={[styles.container, { backgroundColor: t.card }]}>
        <View>
          <Text style={[styles.heading, { color: t.text }]}>Welcome Back!</Text>
          <Text style={[styles.subheading, { color: t.textSecondary }]}>Login to continue with Nagar Ek 💚</Text>
        </View>
        <View style={styles.form}>
          <View style={[styles.inputContainer, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}>
            <Feather name="user" size={24} color={t.textMuted} />
            <TextInput
              placeholder="Email"
              placeholderTextColor={t.placeholder}
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: t.inputText }]}
            />
          </View>
          <View style={[styles.inputContainer, { borderColor: t.inputBorder, backgroundColor: t.inputBg }]}>
            <Feather name="lock" size={24} color={t.textMuted} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={t.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, { color: t.inputText }]}
            />
          </View>
          <TouchableOpacity style={styles.linkContainer}>
            <Text style={[styles.link, { color: t.isDark ? '#81c784' : '#0e6c00' }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 }}>
          <View style={[styles.horizontalRule, { backgroundColor: t.isDark ? '#2a3d30' : '#0e6c00' }]} />
          <Text style={{ textAlign: 'center', marginHorizontal: 10, color: t.textSecondary }}>Or continue with</Text>
          <View style={[styles.horizontalRule, { backgroundColor: t.isDark ? '#2a3d30' : '#0e6c00' }]} />
        </View>

        <View style={styles.continueWithContainer}>
          <TouchableOpacity style={[styles.continueWithBtnContainer, { borderColor: t.isDark ? '#2a5c3a' : '#0c570081' }]}>
            <Image style={{ width: 40, height: 40 }} source={require("../../assets/images/essential/google-logo.jpg")} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.continueWithBtnContainer, { borderColor: t.isDark ? '#2a5c3a' : '#0c570081' }]}>
            <Image style={{ width: 30, height: 30 }} source={require("../../assets/images/essential/facebook-logo.jpg")} />
          </TouchableOpacity>
        </View>

        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <Text style={{ color: t.textSecondary }}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => {
            router.replace('/register');
          }}>
            <Text style={[styles.link, { color: t.isDark ? '#81c784' : '#0e6c00' }]}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  container: {
    width: "90%",
    height: "65%",
    paddingHorizontal: 30,
    paddingVertical: 40,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    position: "absolute",
    bottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoContainer: {
    alignItems: "center",
    height: 500,
    width: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  logoSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subheading: {
    fontSize: 13,
  },
  form: {
    gap: 15,
    marginTop: 30
  },
  inputContainer: {
    width: "100%",
    display: 'flex',
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 7,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  button: {
    marginTop: 30,
    width: "100%",
    height: 50,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#0e6c00',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    textDecorationLine: 'underline',
  },
  linkContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  continueWithContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  continueWithBtnContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalRule: {
    flex: 1,
    height: 1,
  },
});