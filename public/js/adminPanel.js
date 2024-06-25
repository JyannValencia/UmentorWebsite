function showDashboard() {
  document.getElementById('mainContent').innerHTML = `
    <div class="container mt-4">
      <h2>Dashboard</h2>
      <p>Welcome to the Dashboard</p>
    </div>
  `;
}

function showUserManagement() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="container mt-4">
      <h2>User Management</h2>
      <button class="btn btn-primary my-3" onclick="openAddUserForm()">Add User</button>
      <button class="btn btn-secondary my-3" onclick="startEditingUser()">Edit User</button>
      <button class="btn btn-danger my-3" onclick="startRemovingUser()">Remove User</button>
      <button class="btn btn-success my-3" onclick="openEnrollmentForm()">Enrollment</button>
      <div class="table-responsive">
        <table class="table table-bordered" id="userTable">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Enrolled Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="userTableBody">
            <!-- User rows will be populated here -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  populateUserTable();
}

function openEnrollmentForm() {
  const popup = `
    <div class="modal fade" id="enrollmentModal" tabindex="-1" aria-labelledby="enrollmentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="enrollmentModalLabel">Enroll or Unenroll User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="enrollmentForm">
              <div class="mb-3">
                <label for="selectUser" class="form-label">Select User</label>
                <select class="form-select" id="selectUser" name="selectUser" required></select>
              </div>
              <div class="mb-3">
                <label for="selectCourse" class="form-label">Select Course</label>
                <select class="form-select" id="selectCourse" name="selectCourse" required></select>
              </div>
              <div class="d-flex justify-content-between">
                <button type="submit" class="btn btn-primary">Enroll User</button>
                <button type="button" class="btn btn-danger" id="unenrollButton">Unenroll User</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', popup);
  const enrollmentModal = new bootstrap.Modal(document.getElementById('enrollmentModal'));
  enrollmentModal.show();

  populateUserSelect();
  populateCourseSelect();

  const enrollmentForm = document.getElementById('enrollmentForm');
  enrollmentForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const userId = enrollmentForm['selectUser'].value;
    const courseId = enrollmentForm['selectCourse'].value;

    firebase.firestore().collection('Users').doc(userId).update({
      enrolledCourses: firebase.firestore.FieldValue.arrayUnion(courseId)
    })
    .then(() => {
      alert('User enrolled in course successfully!');
      enrollmentModal.hide();
      showUserManagement();
    })
    .catch((error) => {
      console.error('Error enrolling user in course: ', error);
      alert('Failed to enroll user in course. Check console for details.');
    });
  });

  document.getElementById('unenrollButton').addEventListener('click', function() {
    const userId = enrollmentForm['selectUser'].value;
    const courseId = enrollmentForm['selectCourse'].value;

    firebase.firestore().collection('Users').doc(userId).update({
      enrolledCourses: firebase.firestore.FieldValue.arrayRemove(courseId)
    })
    .then(() => {
      alert('User unenrolled from course successfully!');
      enrollmentModal.hide();
      showUserManagement();
    })
    .catch((error) => {
      console.error('Error unenrolling user from course: ', error);
      alert('Failed to unenroll user from course. Check console for details.');
    });
  });
}

function populateUserSelect() {
  const userSelect = document.getElementById('selectUser');
  firebase.firestore().collection('Users').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        const userId = doc.id;
        const option = document.createElement('option');
        option.value = userId;
        option.text = user.username;
        userSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error('Error fetching users: ', error);
      alert('Failed to fetch users. Check console for details.');
    });
}

function populateCourseSelect() {
  const courseSelect = document.getElementById('selectCourse');
  firebase.firestore().collection('courses').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const course = doc.data();
        const courseId = doc.id;
        const option = document.createElement('option');
        option.value = courseId;
        option.text = course.title;
        courseSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error('Error fetching courses: ', error);
      alert('Failed to fetch courses. Check console for details.');
    });
}

function populateUserTable() {
  const userTableBody = document.getElementById('userTableBody');
  if (!userTableBody) {
    console.error('userTableBody element not found');
    return;
  }
  userTableBody.innerHTML = '';

  firebase.firestore().collection('Users').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        const userId = doc.id;

        // Create a row for each user
        const row = document.createElement('tr');
        row.setAttribute('data-id', userId);
        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>Loading...</td>
          <td>
            <button class="btn btn-info btn-sm" onclick="showUserDetails('${userId}')">Details</button>
          </td>
        `;
        userTableBody.appendChild(row);

        // Fetch course titles for enrolledCourses
        const coursePromises = user.enrolledCourses.map(courseId => {
          return firebase.firestore().collection('courses').doc(courseId).get();
        });

        // Resolve all promises and update the table
        Promise.all(coursePromises)
          .then(courseDocs => {
            const courseTitles = courseDocs.map(courseDoc => {
              const courseData = courseDoc.data();
              return courseData ? courseData.title : 'Unknown Course';
            });
            const enrolledCoursesCell = row.querySelector('td:nth-child(3)');
            enrolledCoursesCell.textContent = courseTitles.join(', ');
          })
          .catch(error => {
            console.error('Error fetching course details: ', error);
          });
      });
    })
    .catch((error) => {
      console.error('Error fetching users: ', error);
      alert('Failed to fetch users. Check console for details.');
    });
}

function fetchEnrolledCourses(userId) {
  const enrolledCoursesCell = document.getElementById(`enrolledCourses_${userId}`);
  
  firebase.firestore().collection('Users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const user = doc.data();
        const enrolledCourses = user.enrolledCourses || [];

        enrolledCoursesCell.innerHTML = enrolledCourses.join(', ');
      } else {
        console.log('No such user document!');
      }
    })
    .catch((error) => {
      console.error('Error fetching enrolled courses: ', error);
      enrolledCoursesCell.innerHTML = 'Error fetching courses';
    });
}

function openUnenrollModal(userId) {
  const modal = `
    <div class="modal fade" id="unenrollModal" tabindex="-1" aria-labelledby="unenrollModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="unenrollModalLabel">Unenroll User from Course</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to unenroll this user from the selected course?</p>
            <div id="unenrollConfirmation"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-danger" onclick="unenrollUser('${userId}')">Unenroll</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', modal);
  const unenrollModal = new bootstrap.Modal(document.getElementById('unenrollModal'));
  unenrollModal.show();
}

function unenrollUser(userId) {
  const userRef = firebase.firestore().collection('Users').doc(userId);

  userRef.update({
    enrolledCourses: []
  })
  .then(() => {
    alert('User unenrolled successfully!');
    const modal = bootstrap.Modal.getInstance(document.getElementById('unenrollModal'));
    modal.hide();
    showUserManagement();
  })
  .catch((error) => {
    console.error('Error unenrolling user: ', error);
    alert('Failed to unenroll user. Check console for details.');
  });
}

function showUserDetails(userId) {
  firebase.firestore().collection('Users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const user = doc.data();
        const enrolledCoursesPromises = user.enrolledCourses.map(courseId => {
          return firebase.firestore().collection('courses').doc(courseId).get();
        });

        Promise.all(enrolledCoursesPromises)
          .then(courseDocs => {
            const courseTitles = courseDocs.map(courseDoc => {
              const courseData = courseDoc.data();
              return courseData ? courseData.title : 'Unknown Course';
            });

            // Populate modal with user details
            const modalContent = `
              <div class="modal fade" id="userDetailsModal" tabindex="-1" aria-labelledby="userDetailsModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title" id="userDetailsModalLabel">User Details</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <p><strong>Name:</strong> ${user.username}</p>
                      <p><strong>Email:</strong> ${user.email}</p>
                      <p><strong>Enrolled Courses:</strong> ${courseTitles.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            `;

            document.getElementById('mainContent').insertAdjacentHTML('beforeend', modalContent);
            const userDetailsModal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
            userDetailsModal.show();

            // Remove modal from DOM after it's closed
            userDetailsModal._element.addEventListener('hidden.bs.modal', function () {
              document.getElementById('userDetailsModal').remove();
            });
          })
          .catch(error => {
            console.error('Error fetching course details: ', error);
          });
      } else {
        console.log('No such user document!');
      }
    })
    .catch((error) => {
      console.error('Error fetching user: ', error);
      alert('Failed to fetch user details. Check console for details.');
    });
}
function openAddUserForm() {
  const popup = `
    <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addUserModalLabel">Add User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="addUserForm">
              <div class="mb-3">
                <label for="userName" class="form-label">Name</label>
                <input type="text" class="form-control" id="userName" name="userName" required>
              </div>
              <div class="mb-3">
                <label for="userEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="userEmail" name="userEmail" required>
              </div>
              <div class="mb-3">
                <label for="userPassword" class="form-label">Password</label>
                <input type="password" class="form-control" id="userPassword" name="userPassword" required>
              </div>
              <button type="submit" class="btn btn-primary">Add User</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', popup);
  const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
  addUserModal.show();

  const addUserForm = document.getElementById('addUserForm');
  addUserForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const userName = addUserForm['userName'].value;
    const userEmail = addUserForm['userEmail'].value;
    const userPassword = addUserForm['userPassword'].value;

    firebase.auth().createUserWithEmailAndPassword(userEmail, userPassword)
      .then((userCredential) => {
        const userId = userCredential.user.uid;
        return firebase.firestore().collection('Users').doc(userId).set({
          username: userName,
          email: userEmail,
          bookmarkedCourses: [],
          enrolledCourses: []
        });
      })
      .then(() => {
        alert('User added successfully!');
        addUserModal.hide();
        showUserManagement();
      })
      .catch((error) => {
        console.error('Error adding user: ', error);
        alert('Failed to add user. Check console for details.');
      });
  });
}

let editingUserId = null;
function startEditingUser() {
  editingUserId = null;
  alert('Click on a user in the table to edit their details.');
  const rows = document.querySelectorAll('#userTable tbody tr');
  rows.forEach(row => {
    row.addEventListener('click', (event) => {
      const userId = event.currentTarget.getAttribute('data-id');
      firebase.firestore().collection('Users').doc(userId).get()
        .then(doc => {
          const user = doc.data();
          editingUserId = userId;
          openEditUserForm(userId, user);
        })
        .catch(error => {
          console.error('Error fetching user: ', error);
          alert('Failed to fetch user. Check console for details.');
        });
    }, { once: true });
  });
}

function openEditUserForm(userId, user) {
  const popup = `
    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserModalLabel">Edit User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="editUserForm">
              <div class="mb-3">
                <label for="editUserName" class="form-label">Name</label>
                <input type="text" class="form-control" id="editUserName" name="editUserName" value="${user.username}" required>
              </div>
              <div class="mb-3">
                <label for="editUserEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="editUserEmail" name="editUserEmail" value="${user.email}" required>
              </div>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', popup);
  const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
  editUserModal.show();

  const editUserForm = document.getElementById('editUserForm');
  editUserForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const userName = editUserForm['editUserName'].value;
    const userEmail = editUserForm['editUserEmail'].value;

    firebase.firestore().collection('Users').doc(userId).update({
      username: userName,
      email: userEmail
    })
    .then(() => {
      alert('User details updated successfully!');
      editUserModal.hide();
      showUserManagement();
    })
    .catch((error) => {
      console.error('Error updating user: ', error);
      alert('Failed to update user. Check console for details.');
    });
  });
}

function startRemovingUser() {
  alert('Click on a user in the table to remove them.');
  const rows = document.querySelectorAll('#userTable tbody tr');
  rows.forEach(row => {
    row.addEventListener('click', (event) => {
      const userId = event.currentTarget.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this user?')) {
        firebase.auth().deleteUser(userId)
          .then(() => {
            return firebase.firestore().collection('Users').doc(userId).delete();
          })
          .then(() => {
            alert('User removed successfully!');
            showUserManagement();
          })
          .catch(error => {
            console.error('Error removing user: ', error);
            alert('Failed to remove user. Check console for details.');
          });
      }
    }, { once: true });
  });
}

function showCourseManagement() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="container mt-4">
      <h2>Course Management</h2>
      <button class="btn btn-primary my-3" onclick="openAddCourseForm()">Add Course</button>
      <div id="courseList" class="row"></div>
    </div>
  `;

  populateCourseList();
}

function populateCourseList() {
  const courseList = document.getElementById('courseList');
  courseList.innerHTML = '';

  firebase.firestore().collection('courses').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const course = doc.data();
        const courseId = doc.id;

        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-3');
        card.innerHTML = `
          <div class="card">
            <img src="${course.imageUrl}" class="card-img-top" alt="Course Image">
            <div class="card-body">
              <h5 class="card-title">${course.title}</h5>
              <p class="card-text"><strong>Description:</strong> ${course.description}</p>
              <p class="card-text"><strong>Instructor:</strong> ${course.instructor}</p>
              <button class="btn btn-info me-2" onclick="viewLessons('${courseId}')">View Lessons</button>
            </div>
          </div>
        `;
        courseList.appendChild(card);
      });
    })
    .catch((error) => {
      console.error('Error fetching courses: ', error);
      alert('Failed to fetch courses. Check console for details.');
    });
}

function viewLessons(courseId) {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="container mt-4">
      <h2>Lessons for Course ${courseId}</h2>
      <button class="btn btn-primary my-3" onclick="openAddLessonForm('${courseId}')">Add Lesson</button>
      <div id="lessonList" class="row"></div>
    </div>
  `;

  populateLessonList(courseId);
}

function populateLessonList(courseId) {
  const lessonList = document.getElementById('lessonList');
  lessonList.innerHTML = '';

  firebase.firestore().collection('courses').doc(courseId).collection('lessons').get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const lesson = doc.data();

        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-3');
        card.innerHTML = `
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">${lesson.title}</h5>
              <p class="card-text"><strong>Video URL:</strong> ${lesson.videoUrl}</p>
              <p class="card-text"><strong>Duration:</strong> ${lesson.duration} minutes</p>
            </div>
          </div>
        `;
        lessonList.appendChild(card);
      });
    })
    .catch((error) => {
      console.error('Error fetching lessons: ', error);
      alert('Failed to fetch lessons. Check console for details.');
    });
}

function openAddCourseForm() {
  const popup = `
    <div class="modal fade" id="addCourseModal" tabindex="-1" aria-labelledby="addCourseModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addCourseModalLabel">Add Course</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="addCourseForm">
              <div class="mb-3">
                <label for="title" class="form-label">Title</label>
                <input type="text" class="form-control" id="title" name="title" required>
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" name="description" rows="4" required></textarea>
              </div>
              <div class="mb-3">
                <label for="instructor" class="form-label">Instructor</label>
                <input type="text" class="form-control" id="instructor" name="instructor" required>
              </div>
              <div class="mb-3">
                <label for="imageFile" class="form-label">Image File</label>
                <input type="file" class="form-control" id="imageFile" name="imageFile" accept="image/*" required>
              </div>
              <button type="submit" class="btn btn-primary">Add Course</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', popup);
  const addCourseModal = new bootstrap.Modal(document.getElementById('addCourseModal'));
  addCourseModal.show();

  const addCourseForm = document.getElementById('addCourseForm');
  addCourseForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const title = addCourseForm['title'].value;
    const description = addCourseForm['description'].value;
    const instructor = addCourseForm['instructor'].value;
    const imageFile = addCourseForm['imageFile'].files[0]; // Get the uploaded file

    // Add course metadata to Firestore
    firebase.firestore().collection('courses').add({
      title: title,
      description: description,
      instructor: instructor,
    })
    .then((docRef) => {
      // Course added successfully, now upload image to Firebase Storage
      const courseId = docRef.id;
      const storageRef = firebase.storage().ref(`courses/${courseId}/${imageFile.name}`);
      const uploadTask = storageRef.put(imageFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Track upload progress if needed
        },
        (error) => {
          console.error('Error uploading image: ', error);
          alert('Failed to upload image. Check console for details.');
        },
        () => {
          // Upload completed successfully, get download URL
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            // Update Firestore document with image URL
            firebase.firestore().collection('courses').doc(courseId).update({
              imageUrl: downloadURL // Save image URL in Firestore
            })
            .then(() => {
              alert('Course added successfully!');
              addCourseModal.hide();
              showCourseManagement();
            })
            .catch((error) => {
              console.error('Error updating course with image URL: ', error);
              alert('Failed to update course with image URL. Check console for details.');
            });
          });
        }
      );
    })
    .catch((error) => {
      console.error('Error adding course: ', error);
      alert('Failed to add course. Check console for details.');
    });
  });
}

function openAddLessonForm(courseId) {
  const popup = `
    <div class="modal fade" id="addLessonModal" tabindex="-1" aria-labelledby="addLessonModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addLessonModalLabel">Add Lesson</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="addLessonForm">
              <div class="mb-3">
                <label for="lessonTitle" class="form-label">Title</label>
                <input type="text" class="form-control" id="lessonTitle" name="lessonTitle" required>
              </div>
              <div class="mb-3">
                <label for="videoFile" class="form-label">Video File</label>
                <input type="file" class="form-control" id="videoFile" name="videoFile" accept="video/mp4" required>
              </div>
              <div class="mb-3">
                <label for="duration" class="form-label">Duration (in minutes)</label>
                <input type="number" class="form-control" id="duration" name="duration" required>
              </div>
              <button type="submit" class="btn btn-primary">Add Lesson</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('mainContent').insertAdjacentHTML('beforeend', popup);
  const addLessonModal = new bootstrap.Modal(document.getElementById('addLessonModal'));
  addLessonModal.show();

  const addLessonForm = document.getElementById('addLessonForm');
  addLessonForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const lessonTitle = addLessonForm['lessonTitle'].value;
    const videoFile = addLessonForm['videoFile'].files[0]; // Get the uploaded file
    const duration = parseInt(addLessonForm['duration'].value);

    // Upload video file to Firebase Storage
    const storageRef = firebase.storage().ref(`courses/${courseId}/lessons/${videoFile.name}`);
    const uploadTask = storageRef.put(videoFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        // Track upload progress if needed
      },
      (error) => {
        console.error('Error uploading video: ', error);
        alert('Failed to upload video. Check console for details.');
      },
      () => {
        // Upload completed successfully, get download URL
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          // Add lesson metadata to Firestore
          firebase.firestore().collection('courses').doc(courseId).collection('lessons').add({
            title: lessonTitle,
            videoUrl: downloadURL,
            duration: duration
          })
          .then(() => {
            alert('Lesson added successfully!');
            addLessonModal.hide();
            viewLessons(courseId);
          })
          .catch((error) => {
            console.error('Error adding lesson: ', error);
            alert('Failed to add lesson. Check console for details.');
          });
        });
      }
    );
  });
}
