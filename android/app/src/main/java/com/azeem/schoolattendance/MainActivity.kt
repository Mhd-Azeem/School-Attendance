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
import androidx.compose.ui.platform.LocalContext
import com.azeem.schoolattendance.data.*
import com.azeem.schoolattendance.update.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = SessionStore(applicationContext)
        val api = SupabaseApi(store)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(primary=Color(0xFF173B57),secondary=Color(0xFF16845B))) {
                AttendanceApp(api, store)
            }
        }
    }
}

@Composable
fun AttendanceApp(api: SupabaseApi, store: SessionStore) {
    val context=LocalContext.current
    var update by remember { mutableStateOf<AppUpdate?>(null) }
    LaunchedEffect(Unit) { runCatching { UpdateChecker.check() }.onSuccess { update=it } }
    update?.let { u ->
        AlertDialog(onDismissRequest={update=null},title={Text("Update available")},text={Text("School Attendance ${u.version} is available. Download the latest original APK?")},confirmButton={TextButton(onClick={UpdateChecker.openDownload(context,u);update=null}){Text("Update")}},dismissButton={TextButton(onClick={update=null}){Text("Later")}})
    }
    var profile by remember { mutableStateOf<Profile?>(null) }
    var restoring by remember { mutableStateOf(store.accessToken != null) }
    LaunchedEffect(Unit) {
        if (store.accessToken != null) {
            runCatching { api.me() }
                .onSuccess { profile = it }
                .onFailure { store.clear() }
        }
        restoring = false
    }
    if (restoring) {
        Box(Modifier.fillMaxSize(), contentAlignment=Alignment.Center) { CircularProgressIndicator() }
    } else if (profile == null) {
        LoginScreen(api) { profile = it }
    } else {
        HomeScreen(api, profile!!) { api.logout(); profile = null }
    }
}

@Composable fun DeveloperCredit(modifier:Modifier=Modifier)=Text("Developed by Mohammed Azeem ©",style=MaterialTheme.typography.labelSmall,color=Color.Gray,modifier=modifier)

@Composable
fun LoginScreen(api:SupabaseApi,onLogin:(Profile)->Unit){
    var username by remember{mutableStateOf("")};var password by remember{mutableStateOf("")}
    var error by remember{mutableStateOf("")};var busy by remember{mutableStateOf(false)}
    val scope=rememberCoroutineScope()
    Box(Modifier.fillMaxSize().padding(28.dp)){
        Column(Modifier.align(Alignment.Center).widthIn(max=420.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){
            Text("School Attendance",style=MaterialTheme.typography.headlineMedium);Text("Sign in to your secure portal.")
            OutlinedTextField(username,{username=it},label={Text("Username")},singleLine=true,modifier=Modifier.fillMaxWidth())
            OutlinedTextField(password,{password=it},label={Text("Password")},singleLine=true,visualTransformation=PasswordVisualTransformation(),modifier=Modifier.fillMaxWidth())
            if(error.isNotBlank())Text(error,color=MaterialTheme.colorScheme.error)
            Button(onClick={scope.launch{busy=true;error="";runCatching{api.login(username.trim(),password)}.onSuccess{if(it.isActive)onLogin(it)else error="This account is disabled."}.onFailure{error="Sign in failed"};busy=false}},enabled=!busy,modifier=Modifier.fillMaxWidth()){Text(if(busy)"Signing in…" else "Sign in")}
        }
        DeveloperCredit(Modifier.align(Alignment.BottomCenter).padding(bottom=8.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(api:SupabaseApi,profile:Profile,onLogout:()->Unit){
    var classes by remember{mutableStateOf<List<SchoolClass>>(emptyList())}
    var selectedId by remember{mutableStateOf<String?>(null)}
    val studentCache=remember{mutableStateMapOf<String,List<Student>>()}
    var loading by remember{mutableStateOf(true)}
    var error by remember{mutableStateOf("")}
    LaunchedEffect(Unit){
        runCatching{api.classes()}.onSuccess{list->classes=list;selectedId=list.firstOrNull()?.id}.onFailure{error="Could not load classes."}
        loading=false
    }
    LaunchedEffect(selectedId){
        val id=selectedId?:return@LaunchedEffect
        if(!studentCache.containsKey(id)) runCatching{api.students(id)}.onSuccess{studentCache[id]=it}.onFailure{error="Could not load students."}
    }
    val students=studentCache[selectedId].orEmpty()
    Scaffold(topBar={TopAppBar(title={Column{Text("School Attendance");Text(profile.fullName,style=MaterialTheme.typography.labelSmall)}},actions={TextButton(onClick=onLogout){Text("Logout")}})},bottomBar={Surface(tonalElevation=1.dp){Box(Modifier.fillMaxWidth().padding(8.dp),contentAlignment=Alignment.Center){DeveloperCredit()}}}){pad->
        Column(Modifier.padding(pad).padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){
            Text(if(profile.role=="SECTION_HEAD")"Section Head Dashboard" else "Teacher Portal",style=MaterialTheme.typography.headlineSmall)
            if(error.isNotBlank())Text(error,color=MaterialTheme.colorScheme.error)
            if(loading)LinearProgressIndicator(Modifier.fillMaxWidth())
            else if(classes.isEmpty())Text("No accessible classes assigned.")
            else LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp),modifier=Modifier.fillMaxSize()){
                items(classes,key={it.id}){cl->
                    val selected=selectedId==cl.id
                    Card(onClick={selectedId=cl.id},colors=CardDefaults.cardColors(containerColor=if(selected)Color(0xFFE5F0F6)else Color.White)){
                        Row(Modifier.fillMaxWidth().padding(16.dp),horizontalArrangement=Arrangement.SpaceBetween){
                            Text(cl.displayName,style=MaterialTheme.typography.titleMedium)
                            Text(if(selected)"${students.size} students" else "Open")
                        }
                    }
                }
                selectedId?.let{id->item(key="action-$id"){Button(onClick={},modifier=Modifier.fillMaxWidth()){Text("Mark Today's Attendance")}}}
            }
        }
    }
}
