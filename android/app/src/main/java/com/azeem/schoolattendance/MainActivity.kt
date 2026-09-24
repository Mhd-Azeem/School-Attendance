package com.azeem.schoolattendance
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.azeem.schoolattendance.data.*
import kotlinx.coroutines.launch

class MainActivity:ComponentActivity(){override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);val store=SessionStore(this);val api=SupabaseApi(store);setContent{MaterialTheme(colorScheme=lightColorScheme(primary=Color(0xFF173B57),secondary=Color(0xFF16845B))){if(BuildConfig.DEMO_MODE) DemoApp() else AttendanceApp(api,store)}}}}
@Composable fun AttendanceApp(api:SupabaseApi,store:SessionStore){var profile by remember{mutableStateOf<Profile?>(null)};if(store.accessToken==null||profile==null)LoginScreen(api){profile=it}else HomeScreen(api,profile!!){api.logout();profile=null}}
@Composable fun DeveloperCredit(modifier:Modifier=Modifier){Text("Developed by Mohammed Azeem ©",style=MaterialTheme.typography.labelSmall,color=Color.Gray,modifier=modifier)}
@Composable fun LoginScreen(api:SupabaseApi,onLogin:(Profile)->Unit){var email by remember{mutableStateOf("")};var password by remember{mutableStateOf("")};var error by remember{mutableStateOf("")};var busy by remember{mutableStateOf(false)};val scope=rememberCoroutineScope();Box(Modifier.fillMaxSize().padding(28.dp)){Column(Modifier.align(Alignment.Center).widthIn(max=420.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){Text("School Attendance",style=MaterialTheme.typography.headlineMedium);Text("Sign in to your secure portal.");OutlinedTextField(email,{email=it},label={Text("Email")},modifier=Modifier.fillMaxWidth());OutlinedTextField(password,{password=it},label={Text("Password")},visualTransformation=PasswordVisualTransformation(),modifier=Modifier.fillMaxWidth());if(error.isNotBlank())Text(error,color=MaterialTheme.colorScheme.error);Button(onClick={scope.launch{busy=true;error="";runCatching{api.login(email,password)}.onSuccess{if(it.isActive)onLogin(it)else error="This account is disabled."}.onFailure{error=it.message?:"Sign in failed"};busy=false}},enabled=!busy,modifier=Modifier.fillMaxWidth()){Text(if(busy)"Signing in…" else "Sign in")}};DeveloperCredit(Modifier.align(Alignment.BottomCenter).padding(bottom=8.dp))}}
@OptIn(ExperimentalMaterial3Api::class)
@Composable fun HomeScreen(api:SupabaseApi,profile:Profile,onLogout:()->Unit){var classes by remember{mutableStateOf(emptyList<SchoolClass>())};var selected by remember{mutableStateOf<SchoolClass?>(null)};var students by remember{mutableStateOf(emptyList<Student>())};LaunchedEffect(Unit){runCatching{api.classes()}.onSuccess{classes=it;selected=it.firstOrNull()}};LaunchedEffect(selected){selected?.let{runCatching{api.students(it.id)}.onSuccess{x->students=x}}};Scaffold(topBar={TopAppBar(title={Column{Text("School Attendance");Text(profile.fullName,style=MaterialTheme.typography.labelSmall)}},actions={TextButton(onClick=onLogout){Text("Logout")}})},bottomBar={Surface(tonalElevation=1.dp){Box(Modifier.fillMaxWidth().padding(vertical=8.dp),contentAlignment=Alignment.Center){DeveloperCredit()}}}){pad->Column(Modifier.padding(pad).padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){Text(if(profile.role=="SECTION_HEAD")"Section Head Dashboard" else "Teacher Portal",style=MaterialTheme.typography.headlineSmall);if(classes.isEmpty())Text("No accessible classes assigned.")else{LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp)){items(classes){c->Card(onClick={selected=c},colors=CardDefaults.cardColors(containerColor=if(selected?.id==c.id)Color(0xFFE5F0F6)else Color.White)){Row(Modifier.fillMaxWidth().padding(16.dp),horizontalArrangement=Arrangement.SpaceBetween){Text(c.displayName,style=MaterialTheme.typography.titleMedium);Text(if(selected?.id==c.id)"${students.size} students" else "Open")}}};selected?.let{item{Button(onClick={},modifier=Modifier.fillMaxWidth()){Text("Mark Today's Attendance — ${it.displayName}")}}}}}}}}
